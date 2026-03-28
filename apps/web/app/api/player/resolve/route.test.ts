import { afterEach, describe, expect, it, vi } from "vitest";
import { upstreamUnavailable } from "@/lib/server-errors";
import { readJson, resetTestState } from "@/test/test-helpers";

const resolveMinecraftUsername = vi.fn();

vi.mock("@/lib/api/mojang", () => ({
  resolveMinecraftUsername,
}));

describe("GET /api/player/resolve", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    resetTestState();
    resolveMinecraftUsername.mockReset();
  });

  it("rejects missing usernames", async () => {
    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/player/resolve")
    );

    expect(response.status).toBe(400);
    await expect(
      readJson<{ code: string; error: string }>(response)
    ).resolves.toEqual({
      code: "bad_request",
      error: "Username is required.",
    });
  });

  it("rejects malformed usernames", async () => {
    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/player/resolve?username=bad-name")
    );

    expect(response.status).toBe(400);
    expect((await readJson<{ code: string }>(response)).code).toBe(
      "bad_request"
    );
  });

  it("returns a successful response with rate limit headers", async () => {
    resolveMinecraftUsername.mockResolvedValue({
      username: "Notch",
      uuid: "player-uuid",
    });

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/player/resolve?username=Notch", {
        headers: { "x-forwarded-for": "1.2.3.4" },
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("RateLimit-Limit")).toBe("30");
    expect(response.headers.get("RateLimit-Remaining")).toBe("29");
    await expect(
      readJson<{ username: string; uuid: string }>(response)
    ).resolves.toEqual({
      username: "Notch",
      uuid: "player-uuid",
    });
  });

  it("reuses the cache for identical usernames", async () => {
    resolveMinecraftUsername.mockResolvedValue({
      username: "Notch",
      uuid: "player-uuid",
    });

    const { GET } = await import("./route");
    const request = new Request(
      "http://localhost/api/player/resolve?username=Notch",
      {
        headers: { "x-forwarded-for": "1.2.3.4" },
      }
    );

    expect((await GET(request)).status).toBe(200);
    expect((await GET(request)).status).toBe(200);
    expect(resolveMinecraftUsername).toHaveBeenCalledTimes(1);
  });

  it("returns 429 after too many requests from the same ip", async () => {
    resolveMinecraftUsername.mockResolvedValue({
      username: "Notch",
      uuid: "player-uuid",
    });

    const { GET } = await import("./route");
    const request = new Request(
      "http://localhost/api/player/resolve?username=Notch",
      {
        headers: { "x-forwarded-for": "1.2.3.4" },
      }
    );

    for (let index = 0; index < 30; index += 1) {
      expect((await GET(request)).status).toBe(200);
    }

    const response = await GET(request);
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).not.toBeNull();
    expect((await readJson<{ code: string }>(response)).code).toBe(
      "rate_limited"
    );
  });

  it("maps unexpected dependency errors to internal_error", async () => {
    resolveMinecraftUsername.mockRejectedValue(new Error("boom"));

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/player/resolve?username=Notch")
    );

    expect(response.status).toBe(500);
    expect(await readJson<{ code: string; error: string }>(response)).toEqual({
      code: "internal_error",
      error: "Something went wrong. Please try again.",
    });
  });

  it("returns sanitized upstream app errors", async () => {
    resolveMinecraftUsername.mockRejectedValue(
      upstreamUnavailable("Minecraft lookup is unavailable.")
    );

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/player/resolve?username=Notch")
    );

    expect(response.status).toBe(503);
    expect(await readJson<{ code: string; error: string }>(response)).toEqual({
      code: "upstream_unavailable",
      error: "Minecraft lookup is unavailable.",
    });
  });
});
