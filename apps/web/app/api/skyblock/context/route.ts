import {
  selectDefaultProfile,
  summarizeProfiles,
} from "@betterforgeprofits/forge-core/analysis";
import { quickForgeReductionForLevel } from "@betterforgeprofits/forge-core/hotm";
import { NextResponse } from "next/server";
import { getSkyBlockProfiles } from "@/lib/api/hypixel";
import { resolveMinecraftUsername } from "@/lib/api/mojang";
import { getCached } from "@/lib/server-cache";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username")?.trim() ?? "";

    if (!username) {
      return NextResponse.json(
        { error: "Username is required." },
        { status: 400 }
      );
    }

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
      return NextResponse.json(
        { error: "This player has no accessible SkyBlock profiles." },
        { status: 404 }
      );
    }

    const profileSummaries = summarizeProfiles(profiles, player.uuid);
    const selectedProfile = selectDefaultProfile(profileSummaries);

    if (!selectedProfile) {
      return NextResponse.json(
        { error: "No usable SkyBlock profile was found for this player." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      player,
      profiles: profileSummaries,
      selectedProfileId: selectedProfile.profileId,
      profile: {
        ...selectedProfile,
        quickForgeReduction: quickForgeReductionForLevel(
          selectedProfile.quickForgeLevel
        ),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch profile context.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
