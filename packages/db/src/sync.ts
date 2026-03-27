import { normalizeItemName } from "@betterforgeprofits/forge-core/recipes";
import type { ForgeRecipe } from "@betterforgeprofits/forge-core/types";
import { getSql } from "./client";

export async function startSyncRun(source: string) {
  const sql = getSql();
  const rows = await sql<{ id: number }[]>`
    insert into sync_runs (source, started_at, status)
    values (${source}, now(), 'running')
    returning id
  `;
  return rows[0].id;
}

export async function finishSyncRun(
  id: number,
  status: "completed" | "failed",
  meta: Record<string, unknown>,
  errorMessage?: string
) {
  const sql = getSql();
  await sql`
    update sync_runs
    set finished_at = now(),
      status = ${status},
      error_message = ${errorMessage ?? null},
      meta_json = ${JSON.stringify(meta)}
    where id = ${id}
  `;
}

export async function createSnapshot(
  source: "auction" | "bazaar",
  fetchedAt: number,
  hypixelLastUpdated: number | null
) {
  const sql = getSql();
  const rows = await sql<{ id: number }[]>`
    insert into price_snapshots (source, fetched_at, hypixel_last_updated, is_current)
    values (${source}, ${new Date(fetchedAt)}, ${hypixelLastUpdated ? new Date(hypixelLastUpdated) : null}, false)
    returning id
  `;
  return rows[0].id;
}

export async function markSnapshotCurrent(
  source: "auction" | "bazaar",
  snapshotId: number
) {
  const sql = getSql();
  await sql.begin(async (transaction) => {
    await transaction.unsafe(
      "update price_snapshots set is_current = false where source = $1",
      [source]
    );
    await transaction.unsafe(
      "update price_snapshots set is_current = true where id = $1",
      [snapshotId]
    );
  });
}

export async function replaceBazaarPrices(
  snapshotId: number,
  rows: Array<{
    buyOrderPrice: number | null;
    itemName: string;
    lastUpdated: number | null;
    productId: string;
    sellOfferPrice: number | null;
  }>
) {
  const sql = getSql();
  if (rows.length === 0) {
    return;
  }

  await sql`
    insert into bazaar_item_prices ${sql(
      rows.map((row) => ({
        snapshot_id: snapshotId,
        product_id: row.productId,
        item_name: row.itemName,
        buy_order_price: row.buyOrderPrice,
        sell_offer_price: row.sellOfferPrice,
        last_updated: row.lastUpdated ? new Date(row.lastUpdated) : null,
      }))
    )}
  `;
}

export async function replaceAuctionPrices(
  snapshotId: number,
  rows: Array<{
    displayName: string;
    lastUpdated: number | null;
    lowestBin: number;
    normalizedName: string;
  }>
) {
  const sql = getSql();
  if (rows.length === 0) {
    return;
  }

  await sql`
    insert into auction_item_prices ${sql(
      rows.map((row) => ({
        snapshot_id: snapshotId,
        normalized_name: row.normalizedName,
        display_name: row.displayName,
        lowest_bin: row.lowestBin,
        last_updated: row.lastUpdated ? new Date(row.lastUpdated) : null,
      }))
    )}
  `;
}

export async function upsertItemAliases(
  rows: Array<{
    auctionMatchName: string;
    normalizedName: string;
    productId: string | null;
    sourcePriority: number;
  }>
) {
  const sql = getSql();
  if (rows.length === 0) {
    return;
  }

  await sql`
    insert into item_aliases ${sql(
      rows.map((row) => ({
        normalized_name: row.normalizedName,
        product_id: row.productId,
        auction_match_name: row.auctionMatchName,
        source_priority: row.sourcePriority,
      }))
    )}
    on conflict (normalized_name) do update
    set product_id = excluded.product_id,
      auction_match_name = excluded.auction_match_name,
      source_priority = excluded.source_priority
  `;
}

export async function cleanupOldSnapshots() {
  const sql = getSql();
  await sql`
    delete from price_snapshots
    where is_current = false
      and fetched_at < now() - interval '7 days'
  `;
}

export function recipeNamesToAliasRows(recipes: ForgeRecipe[]) {
  const seen = new Set<string>();
  const rows: Array<{
    auctionMatchName: string;
    normalizedName: string;
    productId: string | null;
    sourcePriority: number;
  }> = [];

  const pushAlias = (name: string) => {
    const normalized = normalizeItemName(name);
    if (seen.has(normalized)) {
      return;
    }
    seen.add(normalized);
    rows.push({
      normalizedName: normalized,
      auctionMatchName: normalized,
      productId: null,
      sourcePriority: 100,
    });
  };

  for (const recipe of recipes) {
    pushAlias(recipe.output.name);
    for (const ingredient of recipe.ingredients) {
      pushAlias(ingredient.name);
      for (const child of ingredient.children ?? []) {
        pushAlias(child.name);
      }
    }
  }

  return rows;
}
