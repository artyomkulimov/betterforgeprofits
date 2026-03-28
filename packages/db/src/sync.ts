import { normalizeItemName } from "@betterforgeprofits/forge-core/recipes";
import type { ForgeRecipe } from "@betterforgeprofits/forge-core/types";
import { eq, notInArray } from "drizzle-orm";
import { getDb } from "./client";
import {
  auctionItemPrices,
  bazaarItemPrices,
  itemAliases,
  priceSources,
  syncRuns,
} from "./schema";

type PriceSourceName = "auction" | "bazaar";

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

async function upsertPriceSource(
  source: PriceSourceName,
  metadata: {
    fetchedAt: number;
    hypixelLastUpdated: number | null;
    metaJson?: Record<string, unknown>;
    status: string;
  }
) {
  const db = getDb();
  const now = new Date();

  await db
    .insert(priceSources)
    .values({
      source,
      fetchedAt: new Date(metadata.fetchedAt),
      hypixelLastUpdated: metadata.hypixelLastUpdated
        ? new Date(metadata.hypixelLastUpdated)
        : null,
      updatedAt: now,
      status: metadata.status,
      metaJson: metadata.metaJson ?? null,
    })
    .onConflictDoUpdate({
      target: priceSources.source,
      set: {
        fetchedAt: new Date(metadata.fetchedAt),
        hypixelLastUpdated: metadata.hypixelLastUpdated
          ? new Date(metadata.hypixelLastUpdated)
          : null,
        updatedAt: now,
        status: metadata.status,
        metaJson: metadata.metaJson ?? null,
      },
    });
}

export async function replaceCurrentBazaarPrices(
  rows: Array<{
    buyOrderPrice: number | null;
    itemName: string;
    lastUpdated: number | null;
    productId: string;
    sellOfferPrice: number | null;
  }>,
  metadata: {
    fetchedAt: number;
    hypixelLastUpdated: number | null;
  }
) {
  if (rows.length === 0) {
    throw new Error("Refusing to replace Bazaar prices with an empty dataset.");
  }

  const db = getDb();
  const now = new Date();
  const productIds = rows.map((row) => row.productId);

  await db.transaction(async (transaction) => {
    for (const row of rows) {
      await transaction
        .insert(bazaarItemPrices)
        .values({
          productId: row.productId,
          itemName: row.itemName,
          buyOrderPrice: row.buyOrderPrice,
          sellOfferPrice: row.sellOfferPrice,
          lastUpdated: row.lastUpdated ? new Date(row.lastUpdated) : null,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: bazaarItemPrices.productId,
          set: {
            itemName: row.itemName,
            buyOrderPrice: row.buyOrderPrice,
            sellOfferPrice: row.sellOfferPrice,
            lastUpdated: row.lastUpdated ? new Date(row.lastUpdated) : null,
            updatedAt: now,
          },
        });
    }

    await transaction
      .insert(priceSources)
      .values({
        source: "bazaar",
        fetchedAt: new Date(metadata.fetchedAt),
        hypixelLastUpdated: metadata.hypixelLastUpdated
          ? new Date(metadata.hypixelLastUpdated)
          : null,
        updatedAt: now,
        status: "completed",
        metaJson: {
          itemCount: rows.length,
        },
      })
      .onConflictDoUpdate({
        target: priceSources.source,
        set: {
          fetchedAt: new Date(metadata.fetchedAt),
          hypixelLastUpdated: metadata.hypixelLastUpdated
            ? new Date(metadata.hypixelLastUpdated)
            : null,
          updatedAt: now,
          status: "completed",
          metaJson: {
            itemCount: rows.length,
          },
        },
      });

    await transaction
      .delete(bazaarItemPrices)
      .where(notInArray(bazaarItemPrices.productId, productIds));
  });
}

export async function replaceCurrentAuctionPrices(
  rows: Array<{
    displayName: string;
    lastUpdated: number | null;
    lowestBin: number;
    normalizedName: string;
  }>,
  metadata: {
    fetchedAt: number;
    hypixelLastUpdated: number | null;
  }
) {
  if (rows.length === 0) {
    throw new Error(
      "Refusing to replace Auction prices with an empty dataset."
    );
  }

  const db = getDb();
  const now = new Date();
  const normalizedNames = rows.map((row) => row.normalizedName);

  await db.transaction(async (transaction) => {
    for (const row of rows) {
      await transaction
        .insert(auctionItemPrices)
        .values({
          normalizedName: row.normalizedName,
          displayName: row.displayName,
          lowestBin: row.lowestBin,
          lastUpdated: row.lastUpdated ? new Date(row.lastUpdated) : null,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: auctionItemPrices.normalizedName,
          set: {
            displayName: row.displayName,
            lowestBin: row.lowestBin,
            lastUpdated: row.lastUpdated ? new Date(row.lastUpdated) : null,
            updatedAt: now,
          },
        });
    }

    await transaction
      .insert(priceSources)
      .values({
        source: "auction",
        fetchedAt: new Date(metadata.fetchedAt),
        hypixelLastUpdated: metadata.hypixelLastUpdated
          ? new Date(metadata.hypixelLastUpdated)
          : null,
        updatedAt: now,
        status: "completed",
        metaJson: {
          itemCount: rows.length,
        },
      })
      .onConflictDoUpdate({
        target: priceSources.source,
        set: {
          fetchedAt: new Date(metadata.fetchedAt),
          hypixelLastUpdated: metadata.hypixelLastUpdated
            ? new Date(metadata.hypixelLastUpdated)
            : null,
          updatedAt: now,
          status: "completed",
          metaJson: {
            itemCount: rows.length,
          },
        },
      });

    await transaction
      .delete(auctionItemPrices)
      .where(notInArray(auctionItemPrices.normalizedName, normalizedNames));
  });
}

export async function markPriceSourceFailed(
  source: PriceSourceName,
  errorMessage: string,
  metaJson?: Record<string, unknown>
) {
  await upsertPriceSource(source, {
    fetchedAt: Date.now(),
    hypixelLastUpdated: null,
    status: "failed",
    metaJson: {
      ...(metaJson ?? {}),
      errorMessage,
    },
  });
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

export async function trimAliasesToNames(normalizedNames: string[]) {
  const db = getDb();
  if (normalizedNames.length === 0) {
    return;
  }

  await db
    .delete(itemAliases)
    .where(notInArray(itemAliases.normalizedName, normalizedNames));
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
