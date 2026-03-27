import { normalizeItemName } from "@betterforgeprofits/forge-core/recipes";
import type {
  MaterialPricingMode,
  OutputPricingMode,
  PriceFreshnessMeta,
  PriceQuote,
  PriceRepository,
} from "@betterforgeprofits/forge-core/types";
import { and, asc, eq, inArray } from "drizzle-orm";
import { getDb } from "./client";
import {
  auctionItemPrices,
  bazaarItemPrices,
  itemAliases,
  priceSnapshots,
} from "./schema";

function buildDisplayVariants(name: string): string[] {
  const normalized = normalizeItemName(name);
  return Array.from(
    new Set([
      normalized,
      normalized.replace(/\sgemstone\b/g, " gem"),
      normalized.replace(/\sgem\b/g, " gemstone"),
      normalized.replace(/\bores?\b/g, "ore"),
    ])
  ).filter(Boolean);
}

export class PostgresPriceRepository implements PriceRepository {
  async getBazaarQuoteByName(
    name: string,
    mode: MaterialPricingMode | OutputPricingMode
  ): Promise<PriceQuote | null> {
    const db = getDb();
    const candidates = buildDisplayVariants(name);
    const rows = await db
      .select({
        productId: bazaarItemPrices.productId,
        buyOrderPrice: bazaarItemPrices.buyOrderPrice,
        sellOfferPrice: bazaarItemPrices.sellOfferPrice,
      })
      .from(itemAliases)
      .innerJoin(
        priceSnapshots,
        and(
          eq(priceSnapshots.source, "bazaar"),
          eq(priceSnapshots.isCurrent, true)
        )
      )
      .innerJoin(
        bazaarItemPrices,
        and(
          eq(bazaarItemPrices.snapshotId, priceSnapshots.id),
          eq(bazaarItemPrices.productId, itemAliases.productId)
        )
      )
      .where(inArray(itemAliases.normalizedName, candidates))
      .orderBy(asc(itemAliases.sourcePriority))
      .limit(1);

    const match = rows[0];
    if (!match) {
      return null;
    }

    const unitPrice =
      mode === "instant_buy" || mode === "sell_offer"
        ? match.sellOfferPrice
        : match.buyOrderPrice;
    if (unitPrice === null) {
      return null;
    }

    return {
      source: "bazaar",
      unitPrice,
      matchedId: match.productId,
    };
  }

  async getAuctionQuoteByName(name: string): Promise<PriceQuote | null> {
    const db = getDb();
    const candidates = buildDisplayVariants(name);
    const rows = await db
      .select({
        normalizedName: auctionItemPrices.normalizedName,
        lowestBin: auctionItemPrices.lowestBin,
      })
      .from(itemAliases)
      .innerJoin(
        priceSnapshots,
        and(
          eq(priceSnapshots.source, "auction"),
          eq(priceSnapshots.isCurrent, true)
        )
      )
      .innerJoin(
        auctionItemPrices,
        and(
          eq(auctionItemPrices.snapshotId, priceSnapshots.id),
          eq(auctionItemPrices.normalizedName, itemAliases.auctionMatchName)
        )
      )
      .where(inArray(itemAliases.normalizedName, candidates))
      .orderBy(asc(itemAliases.sourcePriority))
      .limit(1);

    const match = rows[0];
    if (!match) {
      return null;
    }

    return {
      source: "auction",
      unitPrice: match.lowestBin,
      matchedId: match.normalizedName,
    };
  }

  async getFreshnessMeta(): Promise<PriceFreshnessMeta> {
    const db = getDb();
    const rows = await db
      .select({
        source: priceSnapshots.source,
        fetchedAt: priceSnapshots.fetchedAt,
      })
      .from(priceSnapshots)
      .where(eq(priceSnapshots.isCurrent, true));

    const bazaar =
      rows.find((row) => row.source === "bazaar")?.fetchedAt?.getTime() ?? null;
    const auction =
      rows.find((row) => row.source === "auction")?.fetchedAt?.getTime() ??
      null;
    const newest = [bazaar, auction].filter(
      (value): value is number => value !== null
    );

    return {
      bazaarSnapshotFetchedAt: bazaar,
      auctionSnapshotFetchedAt: auction,
      snapshotAgeSeconds:
        newest.length === 0
          ? null
          : Math.max(0, Math.round((Date.now() - Math.min(...newest)) / 1000)),
    };
  }
}
