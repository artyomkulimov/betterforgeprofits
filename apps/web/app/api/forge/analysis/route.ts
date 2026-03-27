import { PostgresPriceRepository } from "@betterforgeprofits/db/repository";
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
    username: searchParams.get("username")?.trim() ?? "",
    requestedProfileId: searchParams.get("profileId")?.trim() ?? "",
    materialPricing,
    outputPricing,
    allowAh: searchParams.get("allowAh") === "true",
    hotmOverride: Number(searchParams.get("hotmOverride")),
    quickForgeOverride: Number(searchParams.get("quickForgeOverride")),
  };
}

export async function GET(request: Request) {
  try {
    const {
      allowAh,
      hotmOverride,
      materialPricing,
      outputPricing,
      quickForgeOverride,
      requestedProfileId,
      username,
    } = parseAnalysisRequest(request);

    if (!username) {
      return NextResponse.json(
        { error: "Username is required." },
        { status: 400 }
      );
    }

    const player = await resolveMinecraftUsername(username);
    const payload = await getSkyBlockProfiles(player.uuid);
    const profiles = payload.profiles ?? [];

    if (profiles.length === 0) {
      throw new Error("This player has no accessible SkyBlock profiles.");
    }

    const summaries = summarizeProfiles(profiles, player.uuid);
    const fallback = selectDefaultProfile(summaries);
    const profileId = requestedProfileId || fallback?.profileId;

    if (!profileId) {
      throw new Error("No usable SkyBlock profile was found for this player.");
    }

    const result = await analyzeForge({
      profileId,
      profiles,
      playerUuid: player.uuid,
      priceRepository: new PostgresPriceRepository(),
      materialPricing,
      outputPricing,
      allowAh,
      hotmOverride: Number.isNaN(hotmOverride) ? null : hotmOverride,
      quickForgeOverride: Number.isNaN(quickForgeOverride)
        ? null
        : quickForgeOverride,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to analyze forge data.";
    const status =
      message === "This player has no accessible SkyBlock profiles." ||
      message === "No usable SkyBlock profile was found for this player."
        ? 404
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
