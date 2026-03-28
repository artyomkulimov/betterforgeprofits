import { afterEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/server-errors";
import {
  applyRateLimit,
  getCached,
  getClientIp,
  normalizeUsername,
  parseBoundedInteger,
  validateMinecraftUsername,
} from "@/lib/server-security";
import { resetTestState } from "@/test/test-helpers";

describe("server-security", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    resetTestState();
  });

  it("normalizes usernames", () => {
    expect(normalizeUsername("  Notch  ")).toBe("Notch");
    expect(normalizeUsername(null)).toBe("");
    expect(normalizeUsername(undefined)).toBe("");
  });

  it("validates minecraft usernames", () => {
    expect(validateMinecraftUsername("Notch")).toBe("Notch");
    expect(validateMinecraftUsername("some_name")).toBe("some_name");
    expect(() => validateMinecraftUsername("")).toThrow(
      "Username is required."
    );
    expect(() => validateMinecraftUsername("bad-name")).toThrow(
      "Username must be 1-16 characters"
    );
    expect(() => validateMinecraftUsername("a".repeat(17))).toThrow(
      "Username must be 1-16 characters"
    );
  });

  it("parses bounded integers", () => {
    expect(parseBoundedInteger(null, "field", { min: 0, max: 10 })).toBeNull();
    expect(parseBoundedInteger("   ", "field", { min: 0, max: 10 })).toBeNull();
    expect(parseBoundedInteger("5", "field", { min: 0, max: 10 })).toBe(5);
    expect(() =>
      parseBoundedInteger("5.5", "field", { min: 0, max: 10 })
    ).toThrow("field must be an integer.");
    expect(() =>
      parseBoundedInteger("-1", "field", { min: 0, max: 10 })
    ).toThrow("field must be between 0 and 10.");
    expect(() =>
      parseBoundedInteger("11", "field", { min: 0, max: 10 })
    ).toThrow("field must be between 0 and 10.");
  });

  it("extracts client ip from forwarded headers", () => {
    expect(
      getClientIp(
        new Request("http://localhost", {
          headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
        })
      )
    ).toBe("1.2.3.4");

    expect(
      getClientIp(
        new Request("http://localhost", {
          headers: { "x-real-ip": "9.8.7.6" },
        })
      )
    ).toBe("9.8.7.6");

    expect(getClientIp(new Request("http://localhost"))).toBe("unknown");
  });

  it("enforces per-ip rate limiting and resets after the window", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-28T00:00:00.000Z"));

    const request = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.4" },
    });

    const first = applyRateLimit(request, {
      namespace: "test",
      limit: 2,
      windowMs: 60_000,
    });
    expect(first.remaining).toBe(1);

    const second = applyRateLimit(request, {
      namespace: "test",
      limit: 2,
      windowMs: 60_000,
    });
    expect(second.remaining).toBe(0);

    try {
      applyRateLimit(request, {
        namespace: "test",
        limit: 2,
        windowMs: 60_000,
      });
      throw new Error("expected rate limit");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("rate_limited");
    }

    vi.advanceTimersByTime(60_001);

    const afterReset = applyRateLimit(request, {
      namespace: "test",
      limit: 2,
      windowMs: 60_000,
    });
    expect(afterReset.remaining).toBe(1);
  });

  it("deduplicates cached calls and drops failed entries", async () => {
    const loader = vi.fn(async () => "value");
    const [first, second] = await Promise.all([
      getCached("shared", 10_000, loader),
      getCached("shared", 10_000, loader),
    ]);

    expect(first).toBe("value");
    expect(second).toBe("value");
    expect(loader).toHaveBeenCalledTimes(1);

    const failingLoader = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce("recovered");

    await expect(getCached("unstable", 10_000, failingLoader)).rejects.toThrow(
      "boom"
    );
    await expect(getCached("unstable", 10_000, failingLoader)).resolves.toBe(
      "recovered"
    );
    expect(failingLoader).toHaveBeenCalledTimes(2);
  });
});
