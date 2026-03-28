import { NextResponse } from "next/server";

import { resolveMinecraftUsername } from "@/lib/api/mojang";
import { AppError, errorResponse, internalError } from "@/lib/server-errors";
import {
  applyRateLimit,
  getCached,
  getRateLimitHeaders,
  normalizeUsername,
  validateMinecraftUsername,
} from "@/lib/server-security";

export async function GET(request: Request) {
  try {
    const rateLimit = applyRateLimit(request, {
      namespace: "player-resolve",
      limit: 30,
      windowMs: 60_000,
    });
    const { searchParams } = new URL(request.url);
    const username = validateMinecraftUsername(
      normalizeUsername(searchParams.get("username"))
    );

    const player = await getCached(
      `player:${username.toLowerCase()}`,
      300_000,
      () => resolveMinecraftUsername(username)
    );
    return NextResponse.json(player, {
      headers: getRateLimitHeaders(rateLimit),
    });
  } catch (error) {
    if (!(error instanceof Error)) {
      console.error("[player-resolve] unexpected error", error);
      return errorResponse(internalError(undefined, error));
    }

    if (error instanceof AppError) {
      if (error.cause) {
        console.error("[player-resolve] request failed", error.cause);
      }
      return errorResponse(error);
    }

    console.error("[player-resolve] unexpected error", error);
    return errorResponse(internalError(undefined, error));
  }
}
