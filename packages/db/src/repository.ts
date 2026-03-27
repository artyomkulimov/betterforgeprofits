import { normalizeItemName } from "@betterforgeprofits/forge-core/recipes";
import type {
  MaterialPricingMode,
  OutputPricingMode,
  PriceFreshnessMeta,
  PriceQuote,
  PriceRepository,
} from "@betterforgeprofits/forge-core/types";
import { getSql } from "./client";

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
    const sql = getSql();
    const candidates = buildDisplayVariants(name);
    const rows = await sql<
      {
        buyOrderPrice: number | null;
        productId: string;
        sellOfferPrice: number | null;
      }[]
    >`
      select bip.product_id as "productId",
        bip.buy_order_price as "buyOrderPrice",
        bip.sell_offer_price as "sellOfferPrice"
      from item_aliases aliases
      join price_snapshots snapshots
        on snapshots.source = 'bazaar'
        and snapshots.is_current = true
      join bazaar_item_prices bip
        on bip.snapshot_id = snapshots.id
        and bip.product_id = aliases.product_id
      where aliases.normalized_name = any(${sql.array(candidates)})
      order by aliases.source_priority asc
      limit 1
    `;

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
    const sql = getSql();
    const candidates = buildDisplayVariants(name);
    const rows = await sql<
      {
        lowestBin: number;
        normalizedName: string;
      }[]
    >`
      select aip.normalized_name as "normalizedName",
        aip.lowest_bin as "lowestBin"
      from item_aliases aliases
      join price_snapshots snapshots
        on snapshots.source = 'auction'
        and snapshots.is_current = true
      join auction_item_prices aip
        on aip.snapshot_id = snapshots.id
        and aip.normalized_name = aliases.auction_match_name
      where aliases.normalized_name = any(${sql.array(candidates)})
      order by aliases.source_priority asc
      limit 1
    `;

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
    const sql = getSql();
    const rows = await sql<
      {
        fetchedAt: number;
        source: "auction" | "bazaar";
      }[]
    >`
      select source, fetched_at as "fetchedAt"
      from price_snapshots
      where is_current = true
    `;

    const bazaar =
      rows.find((row) => row.source === "bazaar")?.fetchedAt ?? null;
    const auction =
      rows.find((row) => row.source === "auction")?.fetchedAt ?? null;
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
