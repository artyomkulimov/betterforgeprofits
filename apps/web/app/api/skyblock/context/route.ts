import {
  selectDefaultProfile,
  summarizeProfiles,
} from "@betterforgeprofits/forge-core/analysis";
import { quickForgeReductionForLevel } from "@betterforgeprofits/forge-core/hotm";
import { NextResponse } from "next/server";
import { getSkyBlockProfiles } from "@/lib/api/hypixel";
import { resolveMinecraftUsername } from "@/lib/api/mojang";
import {
  AppError,
  errorResponse,
  internalError,
  notFound,
} from "@/lib/server-errors";
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
      namespace: "skyblock-context",
      limit: 20,
      windowMs: 60_000,
    });
    const { searchParams } = new URL(request.url);
    const username = validateMinecraftUsername(
      normalizeUsername(searchParams.get("username"))
    );

    const result = await getCached(
      `profiles:${username.toLowerCase()}`,
      60_000,
      async () => {
        const player = await resolveMinecraftUsername(username);
        const payload = await getSkyBlockProfiles(player.uuid);
        return {
          player,
          profiles: payload.profiles ?? [],
        };
      }
    );

    const { player, profiles } = result;

    if (profiles.length === 0) {
      throw notFound("This player has no accessible SkyBlock profiles.");
    }

    const profileSummaries = summarizeProfiles(profiles, player.uuid);
    const selectedProfile = selectDefaultProfile(profileSummaries);

    if (!selectedProfile) {
      throw notFound("No usable SkyBlock profile was found for this player.");
    }

    return NextResponse.json(
      {
        player,
        profiles: profileSummaries,
        selectedProfileId: selectedProfile.profileId,
        profile: {
          ...selectedProfile,
          quickForgeReduction: quickForgeReductionForLevel(
            selectedProfile.quickForgeLevel
          ),
        },
      },
      {
        headers: getRateLimitHeaders(rateLimit),
      }
    );
  } catch (error) {
    if (!(error instanceof Error)) {
      console.error("[skyblock-context] unexpected error", error);
      return errorResponse(internalError(undefined, error));
    }

    if (error instanceof AppError) {
      if (error.cause) {
        console.error("[skyblock-context] request failed", error.cause);
      }
      return errorResponse(error);
    }

    console.error("[skyblock-context] unexpected error", error);
    return errorResponse(internalError(undefined, error));
  }
}
