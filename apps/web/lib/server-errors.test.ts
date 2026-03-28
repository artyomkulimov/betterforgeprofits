import { describe, expect, it } from "vitest";
import {
  AppError,
  asAppError,
  badRequest,
  errorResponse,
  internalError,
  notFound,
  rateLimited,
  upstreamUnavailable,
} from "@/lib/server-errors";
import { readJson } from "@/test/test-helpers";

describe("server-errors", () => {
  it("creates typed app errors with the expected codes and statuses", () => {
    expect(badRequest("bad")).toMatchObject({
      code: "bad_request",
      status: 400,
    });
    expect(notFound("missing")).toMatchObject({
      code: "not_found",
      status: 404,
    });
    expect(rateLimited("slow down", 60)).toMatchObject({
      code: "rate_limited",
      status: 429,
    });
    expect(upstreamUnavailable("upstream")).toMatchObject({
      code: "upstream_unavailable",
      status: 503,
    });
    expect(internalError()).toMatchObject({
      code: "internal_error",
      status: 500,
    });
  });

  it("passes through existing app errors and wraps unknown ones", () => {
    const appError = badRequest("bad");
    expect(asAppError(appError)).toBe(appError);

    const wrapped = asAppError(new Error("boom"));
    expect(wrapped).toBeInstanceOf(AppError);
    expect(wrapped.code).toBe("internal_error");
    expect(wrapped.status).toBe(500);
  });

  it("formats json responses with no-store headers", async () => {
    const response = errorResponse(badRequest("Invalid request."));
    expect(response.status).toBe(400);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(
      readJson<{ code: string; error: string }>(response)
    ).resolves.toEqual({
      code: "bad_request",
      error: "Invalid request.",
    });
  });

  it("includes retry-after for rate-limited responses", async () => {
    const response = errorResponse(rateLimited("Too many requests.", 12));
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("12");
    await expect(
      readJson<{ code: string; error: string }>(response)
    ).resolves.toEqual({
      code: "rate_limited",
      error: "Too many requests.",
    });
  });
});
