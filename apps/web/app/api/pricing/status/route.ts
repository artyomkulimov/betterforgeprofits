import { PostgresPriceRepository } from "@betterforgeprofits/db/repository";
import { NextResponse } from "next/server";

export async function GET() {
  const repository = new PostgresPriceRepository();
  const pricingMeta = await repository.getFreshnessMeta();
  const lastUpdatedAt = Math.max(
    pricingMeta.bazaarSnapshotFetchedAt ?? 0,
    pricingMeta.auctionSnapshotFetchedAt ?? 0
  );

  return NextResponse.json(
    {
      ok: true,
      pricingMeta,
      lastUpdatedAt: lastUpdatedAt > 0 ? lastUpdatedAt : null,
      checkedAt: Date.now(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
