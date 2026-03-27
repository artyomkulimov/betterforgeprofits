import {
  bigint,
  bigserial,
  boolean,
  doublePrecision,
  index,
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

export const priceSnapshots = pgTable(
  "price_snapshots",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    source: text("source", { enum: ["bazaar", "auction"] }).notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull(),
    hypixelLastUpdated: timestamp("hypixel_last_updated", {
      withTimezone: true,
    }),
    isCurrent: boolean("is_current").notNull().default(false),
  },
  (table) => ({
    sourceCurrentIdx: index("price_snapshots_source_current_idx").on(
      table.source,
      table.isCurrent
    ),
  })
);

export const bazaarItemPrices = pgTable(
  "bazaar_item_prices",
  {
    snapshotId: bigint("snapshot_id", { mode: "number" })
      .notNull()
      .references(() => priceSnapshots.id, { onDelete: "cascade" }),
    productId: text("product_id").notNull(),
    itemName: text("item_name").notNull(),
    buyOrderPrice: doublePrecision("buy_order_price"),
    sellOfferPrice: doublePrecision("sell_offer_price"),
    lastUpdated: timestamp("last_updated", { withTimezone: true }),
  },
  (table) => ({
    productSnapshotIdx: index("bazaar_item_prices_product_snapshot_idx").on(
      table.productId,
      table.snapshotId
    ),
  })
);

export const auctionItemPrices = pgTable(
  "auction_item_prices",
  {
    snapshotId: bigint("snapshot_id", { mode: "number" })
      .notNull()
      .references(() => priceSnapshots.id, { onDelete: "cascade" }),
    normalizedName: text("normalized_name").notNull(),
    displayName: text("display_name").notNull(),
    lowestBin: doublePrecision("lowest_bin").notNull(),
    lastUpdated: timestamp("last_updated", { withTimezone: true }),
  },
  (table) => ({
    nameSnapshotIdx: index("auction_item_prices_name_snapshot_idx").on(
      table.normalizedName,
      table.snapshotId
    ),
  })
);

export const itemAliases = pgTable("item_aliases", {
  normalizedName: text("normalized_name").primaryKey(),
  productId: text("product_id"),
  auctionMatchName: text("auction_match_name").notNull(),
  sourcePriority: integer("source_priority").notNull().default(100),
});
