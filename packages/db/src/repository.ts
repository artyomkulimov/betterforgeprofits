import { normalizeItemName } from "@betterforgeprofits/forge-core/recipes";
import type {
  AliasSnapshotEntry,
  CurrentPricingSnapshot,
  MaterialPricingMode,
  OutputPricingMode,
  PriceFreshnessMeta,
  PriceQuote,
  PriceRepository,
} from "@betterforgeprofits/forge-core/types";
import { asc } from "drizzle-orm";
import { getDb } from "./client";
import {
  auctionItemPrices,
  bazaarItemPrices,
  itemAliases,
  priceSources,
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

function resolveBazaarUnitPrice(
  mode: MaterialPricingMode | OutputPricingMode,
  quote: {
    buyOrderPrice: number | null;
    sellOfferPrice: number | null;
  }
): number | null {
  if (mode === "instant_buy" || mode === "sell_offer") {
    return quote.buyOrderPrice;
  }

  return quote.sellOfferPrice;
}

function buildFreshnessMeta(
  sourceRows: Array<{
    fetchedAt: Date;
    source: "auction" | "bazaar";
  }>
): PriceFreshnessMeta {
  const bazaar =
    sourceRows.find((row) => row.source === "bazaar")?.fetchedAt.getTime() ??
    null;
  const auction =
    sourceRows.find((row) => row.source === "auction")?.fetchedAt.getTime() ??
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

function sortAliasMatches(
  left: AliasSnapshotEntry,
  right: AliasSnapshotEntry
): number {
  return left.sourcePriority - right.sourcePriority;
}

interface RequestPricingLookupStats {
  auctionLookups: number;
  auctionMisses: number;
  bazaarLookups: number;
  bazaarMisses: number;
  totalLookupTimeMs: number;
}

export class InMemoryPriceRepository implements PriceRepository {
  private readonly snapshot: CurrentPricingSnapshot;

  private readonly aliasMap = new Map<string, AliasSnapshotEntry[]>();

  private readonly auctionMap = new Map<
    string,
    { lowestBin: number; normalizedName: string }
  >();

  private readonly bazaarMap = new Map<
    string,
    {
      buyOrderPrice: number | null;
      productId: string;
      sellOfferPrice: number | null;
    }
  >();

  private readonly stats: RequestPricingLookupStats = {
    bazaarLookups: 0,
    bazaarMisses: 0,
    auctionLookups: 0,
    auctionMisses: 0,
    totalLookupTimeMs: 0,
  };

  constructor(snapshot: CurrentPricingSnapshot) {
    this.snapshot = snapshot;

    for (const alias of snapshot.aliases) {
      const aliases = this.aliasMap.get(alias.normalizedName) ?? [];
      aliases.push(alias);
      aliases.sort(sortAliasMatches);
      this.aliasMap.set(alias.normalizedName, aliases);
    }

    for (const entry of snapshot.bazaar) {
      this.bazaarMap.set(entry.productId, entry);
    }

    for (const entry of snapshot.auction) {
      this.auctionMap.set(entry.normalizedName, entry);
    }
  }

  private measureLookup<T>(run: () => T): T {
    const startedAt = performance.now();
    const result = run();
    this.stats.totalLookupTimeMs += performance.now() - startedAt;
    return result;
  }

  private findAliases(name: string): AliasSnapshotEntry[] {
    return buildDisplayVariants(name).flatMap(
      (candidate) => this.aliasMap.get(candidate) ?? []
    );
  }

  getRequestStats(): RequestPricingLookupStats {
    return {
      ...this.stats,
      totalLookupTimeMs: Math.round(this.stats.totalLookupTimeMs * 1000) / 1000,
    };
  }

  getAuctionQuoteByName(name: string): Promise<PriceQuote | null> {
    this.stats.auctionLookups += 1;

    return Promise.resolve(
      this.measureLookup(() => {
        for (const alias of this.findAliases(name)) {
          const normalizedName = alias.auctionMatchName;
          const match = normalizedName
            ? this.auctionMap.get(normalizedName)
            : undefined;
          if (!match) {
            continue;
          }

          return {
            source: "auction" as const,
            unitPrice: match.lowestBin,
            matchedId: match.normalizedName,
          };
        }

        this.stats.auctionMisses += 1;
        return null;
      })
    );
  }

  getBazaarQuoteByName(
    name: string,
    mode: MaterialPricingMode | OutputPricingMode
  ): Promise<PriceQuote | null> {
    this.stats.bazaarLookups += 1;

    return Promise.resolve(
      this.measureLookup(() => {
        for (const alias of this.findAliases(name)) {
          if (!alias.productId) {
            continue;
          }

          const match = this.bazaarMap.get(alias.productId);
          if (!match) {
            continue;
          }

          const unitPrice = resolveBazaarUnitPrice(mode, match);
          if (unitPrice === null) {
            continue;
          }

          return {
            source: "bazaar" as const,
            unitPrice,
            matchedId: match.productId,
          };
        }

        this.stats.bazaarMisses += 1;
        return null;
      })
    );
  }

  getFreshnessMeta(): Promise<PriceFreshnessMeta> {
    return Promise.resolve(this.snapshot.freshnessMeta);
  }
}

export class PostgresPriceRepository implements PriceRepository {
  async preloadCurrentPricing(): Promise<CurrentPricingSnapshot> {
    const db = getDb();

    const [sourceRows, aliases, bazaar, auction] = await Promise.all([
      db
        .select({
          fetchedAt: priceSources.fetchedAt,
          source: priceSources.source,
        })
        .from(priceSources),
      db
        .select({
          normalizedName: itemAliases.normalizedName,
          productId: itemAliases.productId,
          auctionMatchName: itemAliases.auctionMatchName,
          sourcePriority: itemAliases.sourcePriority,
        })
        .from(itemAliases)
        .orderBy(asc(itemAliases.sourcePriority)),
      db
        .select({
          productId: bazaarItemPrices.productId,
          buyOrderPrice: bazaarItemPrices.buyOrderPrice,
          sellOfferPrice: bazaarItemPrices.sellOfferPrice,
        })
        .from(bazaarItemPrices),
      db
        .select({
          normalizedName: auctionItemPrices.normalizedName,
          lowestBin: auctionItemPrices.lowestBin,
        })
        .from(auctionItemPrices),
    ]);

    return {
      aliases,
      bazaar,
      auction,
      freshnessMeta: buildFreshnessMeta(sourceRows),
    };
  }

  async getBazaarQuoteByName(
    name: string,
    mode: MaterialPricingMode | OutputPricingMode
  ): Promise<PriceQuote | null> {
    const snapshot = await this.preloadCurrentPricing();
    return new InMemoryPriceRepository(snapshot).getBazaarQuoteByName(
      name,
      mode
    );
  }

  async getAuctionQuoteByName(name: string): Promise<PriceQuote | null> {
    const snapshot = await this.preloadCurrentPricing();
    return new InMemoryPriceRepository(snapshot).getAuctionQuoteByName(name);
  }

  async getFreshnessMeta(): Promise<PriceFreshnessMeta> {
    const snapshot = await this.preloadCurrentPricing();
    return snapshot.freshnessMeta;
  }
}

export { resolveBazaarUnitPrice };
