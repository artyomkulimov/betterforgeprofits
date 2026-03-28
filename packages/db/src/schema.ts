import {
  bigserial,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const syncRuns = pgTable("sync_runs", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  source: text("source").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  status: text("status").notNull(),
  errorMessage: text("error_message"),
  metaJson: jsonb("meta_json"),
});

export const priceSources = pgTable("price_sources", {
  source: text("source", { enum: ["bazaar", "auction"] }).primaryKey(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull(),
  hypixelLastUpdated: timestamp("hypixel_last_updated", {
    withTimezone: true,
  }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  status: text("status").notNull(),
  metaJson: jsonb("meta_json"),
});

export const bazaarItemPrices = pgTable("bazaar_item_prices", {
  productId: text("product_id").primaryKey(),
  itemName: text("item_name").notNull(),
  buyOrderPrice: doublePrecision("buy_order_price"),
  sellOfferPrice: doublePrecision("sell_offer_price"),
  lastUpdated: timestamp("last_updated", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const auctionItemPrices = pgTable("auction_item_prices", {
  normalizedName: text("normalized_name").primaryKey(),
  displayName: text("display_name").notNull(),
  lowestBin: doublePrecision("lowest_bin").notNull(),
  lastUpdated: timestamp("last_updated", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const itemAliases = pgTable("item_aliases", {
  normalizedName: text("normalized_name").primaryKey(),
  productId: text("product_id"),
  auctionMatchName: text("auction_match_name").notNull(),
  sourcePriority: integer("source_priority").notNull().default(100),
});
