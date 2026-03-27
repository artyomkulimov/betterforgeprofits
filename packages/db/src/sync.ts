import { normalizeItemName } from "@betterforgeprofits/forge-core/recipes";
import type { ForgeRecipe } from "@betterforgeprofits/forge-core/types";
import { and, eq, inArray, lt } from "drizzle-orm";
import { getDb } from "./client";
import {
  auctionItemPrices,
  bazaarItemPrices,
  itemAliases,
  priceSnapshots,
  syncRuns,
} from "./schema";

export async function startSyncRun(source: string) {
  const db = getDb();
  const rows = await db
    .insert(syncRuns)
    .values({
      source,
      startedAt: new Date(),
      status: "running",
    })
    .returning({ id: syncRuns.id });

  return rows[0].id;
}

export async function finishSyncRun(
  id: number,
  status: "completed" | "failed",
  meta: Record<string, unknown>,
  errorMessage?: string
) {
  const db = getDb();
  await db
    .update(syncRuns)
    .set({
      finishedAt: new Date(),
      status,
      errorMessage: errorMessage ?? null,
      metaJson: meta,
    })
    .where(eq(syncRuns.id, id));
}

export async function createSnapshot(
  source: "auction" | "bazaar",
  fetchedAt: number,
  hypixelLastUpdated: number | null
) {
  const db = getDb();
  const rows = await db
    .insert(priceSnapshots)
    .values({
      source,
      fetchedAt: new Date(fetchedAt),
      hypixelLastUpdated: hypixelLastUpdated
        ? new Date(hypixelLastUpdated)
        : null,
      isCurrent: false,
    })
    .returning({ id: priceSnapshots.id });

  return rows[0].id;
}

export async function markSnapshotCurrent(
  source: "auction" | "bazaar",
  snapshotId: number
) {
  const db = getDb();
  await db.transaction(async (transaction) => {
    await transaction
      .update(priceSnapshots)
      .set({ isCurrent: false })
      .where(eq(priceSnapshots.source, source));

    await transaction
      .update(priceSnapshots)
      .set({ isCurrent: true })
      .where(eq(priceSnapshots.id, snapshotId));
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
  const db = getDb();
  if (rows.length === 0) {
    return;
  }

  await db.insert(bazaarItemPrices).values(
    rows.map((row) => ({
      snapshotId,
      productId: row.productId,
      itemName: row.itemName,
      buyOrderPrice: row.buyOrderPrice,
      sellOfferPrice: row.sellOfferPrice,
      lastUpdated: row.lastUpdated ? new Date(row.lastUpdated) : null,
    }))
  );
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
  const db = getDb();
  if (rows.length === 0) {
    return;
  }

  await db.insert(auctionItemPrices).values(
    rows.map((row) => ({
      snapshotId,
      normalizedName: row.normalizedName,
      displayName: row.displayName,
      lowestBin: row.lowestBin,
      lastUpdated: row.lastUpdated ? new Date(row.lastUpdated) : null,
    }))
  );
}

export async function upsertItemAliases(
  rows: Array<{
    auctionMatchName: string;
    normalizedName: string;
    productId: string | null;
    sourcePriority: number;
  }>
) {
  const db = getDb();
  if (rows.length === 0) {
    return;
  }

  for (const row of rows) {
    await db
      .insert(itemAliases)
      .values({
        normalizedName: row.normalizedName,
        productId: row.productId,
        auctionMatchName: row.auctionMatchName,
        sourcePriority: row.sourcePriority,
      })
      .onConflictDoUpdate({
        target: itemAliases.normalizedName,
        set: {
          productId: row.productId,
          auctionMatchName: row.auctionMatchName,
          sourcePriority: row.sourcePriority,
        },
      });
  }
}

export async function cleanupOldSnapshots() {
  const db = getDb();
  const staleBefore = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const staleSnapshots = await db
    .select({ id: priceSnapshots.id })
    .from(priceSnapshots)
    .where(
      and(
        eq(priceSnapshots.isCurrent, false),
        lt(priceSnapshots.fetchedAt, staleBefore)
      )
    );

  if (staleSnapshots.length === 0) {
    return;
  }

  await db.delete(priceSnapshots).where(
    inArray(
      priceSnapshots.id,
      staleSnapshots.map((snapshot) => snapshot.id)
    )
  );
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
