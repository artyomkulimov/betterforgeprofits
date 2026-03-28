import {
  InMemoryPriceRepository,
  PostgresPriceRepository,
} from "@betterforgeprofits/db/repository";
import {
  analyzeForge,
  selectDefaultProfile,
  summarizeProfiles,
} from "@betterforgeprofits/forge-core/analysis";
import type {
  MaterialPricingMode,
  OutputPricingMode,
} from "@betterforgeprofits/forge-core/types";
import { NextResponse } from "next/server";

import { getSkyBlockProfiles } from "@/lib/api/hypixel";
import { resolveMinecraftUsername } from "@/lib/api/mojang";
import {
  AppError,
  badRequest,
  errorResponse,
  internalError,
  notFound,
} from "@/lib/server-errors";
import {
  applyRateLimit,
  getCached,
  getRateLimitHeaders,
  normalizeUsername,
  parseBoundedInteger,
  validateMinecraftUsername,
} from "@/lib/server-security";

function roundDuration(durationMs: number): number {
  return Math.round(durationMs * 100) / 100;
}

function logAnalysisEvent(
  event: string,
  requestId: string,
  fields: Record<string, unknown> = {}
) {
  console.info("[forge-analysis]", {
    event,
    requestId,
    ...fields,
  });
}

async function measureAsync<T>(
  event: string,
  requestId: string,
  run: () => Promise<T>,
  fields: Record<string, unknown> = {}
): Promise<{ durationMs: number; result: T }> {
  const startedAt = performance.now();
  const result = await run();
  const durationMs = roundDuration(performance.now() - startedAt);
  logAnalysisEvent(event, requestId, {
    ...fields,
    durationMs,
  });
  return { result, durationMs };
}

function parseAnalysisRequest(request: Request) {
  const { searchParams } = new URL(request.url);
  const materialPricing: MaterialPricingMode =
    searchParams.get("materialPricing") === "buy_order"
      ? "buy_order"
      : "instant_buy";
  const outputPricing: OutputPricingMode =
    searchParams.get("outputPricing") === "instant_sell"
      ? "instant_sell"
      : "sell_offer";

  return {
    username: validateMinecraftUsername(
      normalizeUsername(searchParams.get("username"))
    ),
    requestedProfileId: searchParams.get("profileId")?.trim() ?? "",
    materialPricing,
    outputPricing,
    allowAh: searchParams.get("allowAh") === "true",
    hotmOverride: parseBoundedInteger(
      searchParams.get("hotmOverride"),
      "hotmOverride",
      {
        min: 0,
        max: 10,
      }
    ),
    quickForgeOverride: parseBoundedInteger(
      searchParams.get("quickForgeOverride"),
      "quickForgeOverride",
      {
        min: 0,
        max: 20,
      }
    ),
  };
}

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const requestStartedAt = performance.now();
  const debugAnalysis = process.env.DEBUG_FORGE_ANALYSIS === "true";

  try {
    const rateLimit = applyRateLimit(request, {
      namespace: "forge-analysis",
      limit: 10,
      windowMs: 60_000,
    });
    const {
      allowAh,
      hotmOverride,
      materialPricing,
      outputPricing,
      quickForgeOverride,
      requestedProfileId,
      username,
    } = parseAnalysisRequest(request);

    logAnalysisEvent("request_started", requestId, {
      allowAh,
      materialPricing,
      outputPricing,
      requestedProfile: Boolean(requestedProfileId),
      usernameLength: username.length,
    });

    const analysisCacheKey = [
      "analysis",
      username.toLowerCase(),
      requestedProfileId || "default",
      materialPricing,
      outputPricing,
      String(allowAh),
      hotmOverride ?? "profile",
      quickForgeOverride ?? "profile",
    ].join(":");

    const analysisPayload = await getCached(
      analysisCacheKey,
      30_000,
      async () => {
        const { result: player } = await measureAsync(
          "username_resolved",
          requestId,
          () => resolveMinecraftUsername(username),
          { usernameLength: username.length }
        );
        const { result: payload } = await measureAsync(
          "profiles_fetched",
          requestId,
          () => getSkyBlockProfiles(player.uuid),
          { usernameLength: username.length }
        );
        const profiles = payload.profiles ?? [];

        if (profiles.length === 0) {
          throw notFound("This player has no accessible SkyBlock profiles.");
        }

        const summaries = summarizeProfiles(profiles, player.uuid);
        const fallback = selectDefaultProfile(summaries);
        const profileId = requestedProfileId || fallback?.profileId;

        if (!profileId) {
          throw notFound(
            "No usable SkyBlock profile was found for this player."
          );
        }

        if (!summaries.some((summary) => summary.profileId === profileId)) {
          throw badRequest("profileId does not belong to this player.");
        }

        logAnalysisEvent("profile_selected", requestId, {
          fallbackProfileId: fallback?.profileId ?? null,
          profileCount: summaries.length,
          selectedProfileId: profileId,
        });

        const dbRepository = new PostgresPriceRepository();
        const { result: snapshot, durationMs: measuredPreloadDurationMs } =
          await measureAsync("pricing_snapshot_preloaded", requestId, () =>
            dbRepository.preloadCurrentPricing()
          );
        const requestRepository = new InMemoryPriceRepository(snapshot);
        const recipeTimings: Array<{
          durationMs: number;
          name: string;
          priceCoverage: string;
          profitPerCraft: number | null;
          recipeId: string;
        }> = [];

        const { result: analysisResult } = await measureAsync(
          "analysis_completed",
          requestId,
          () =>
            analyzeForge({
              profileId,
              profiles,
              playerUuid: player.uuid,
              priceRepository: requestRepository,
              materialPricing,
              outputPricing,
              allowAh,
              hotmOverride,
              quickForgeOverride,
              onRecipeTiming: (timing) => {
                if (debugAnalysis) {
                  recipeTimings.push(timing);
                }
              },
            })
        );

        if (debugAnalysis) {
          const slowestRecipes = [...recipeTimings]
            .sort((left, right) => right.durationMs - left.durationMs)
            .slice(0, 5)
            .map((timing) => ({
              recipeId: timing.recipeId,
              name: timing.name,
              durationMs: timing.durationMs,
              priceCoverage: timing.priceCoverage,
              profitPerCraft: timing.profitPerCraft,
            }));

          logAnalysisEvent("debug_recipe_timings", requestId, {
            eligibleRecipes: recipeTimings.length,
            slowestRecipes,
          });
        }

        return {
          preloadDurationMs: measuredPreloadDurationMs,
          requestStats: requestRepository.getRequestStats(),
          result: analysisResult,
        };
      }
    );

    const totalDurationMs = roundDuration(performance.now() - requestStartedAt);

    logAnalysisEvent("request_completed", requestId, {
      totalDurationMs,
      preloadDurationMs: analysisPayload.preloadDurationMs,
      returnedRows: analysisPayload.result.rows.length,
      snapshotAgeSeconds: analysisPayload.result.pricingMeta.snapshotAgeSeconds,
      ...analysisPayload.requestStats,
    });

    return NextResponse.json(analysisPayload.result, {
      headers: getRateLimitHeaders(rateLimit),
    });
  } catch (error) {
    const handledError =
      error instanceof Error ? error : internalError(undefined, error);
    logAnalysisEvent("request_failed", requestId, {
      durationMs: roundDuration(performance.now() - requestStartedAt),
      errorName: handledError.name,
    });

    if (handledError instanceof AppError) {
      if (handledError.cause) {
        console.error("[forge-analysis] request failed", handledError.cause);
      }
      return errorResponse(handledError);
    }

    console.error("[forge-analysis] unexpected error", error);
    return errorResponse(internalError(undefined, error));
  }
}
