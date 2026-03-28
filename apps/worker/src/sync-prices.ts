import {
  finishSyncRun,
  markPriceSourceFailed,
  recipeNamesToAliasRows,
  replaceCurrentAuctionPrices,
  replaceCurrentBazaarPrices,
  startSyncRun,
  upsertItemAliases,
} from "@betterforgeprofits/db/sync";
import {
  getForgeRecipes,
  getForgeRelevantItemNames,
  normalizeItemName,
} from "@betterforgeprofits/forge-core/recipes";
import {
  getSkyBlockAuctions,
  getSkyBlockBazaar,
  getSkyBlockItems,
} from "./hypixel";

const MANUAL_PRODUCT_ALIASES: Record<string, string> = {
  "enchanted mithril": "ENCHANTED_MITHRIL",
  "enchanted titanium": "ENCHANTED_TITANIUM",
  "enchanted tungsten": "ENCHANTED_TUNGSTEN",
  "enchanted umber": "ENCHANTED_UMBER",
  "glacite jewel": "GLACITE_JEWEL",
  mithril: "MITHRIL_ORE",
  "sludge juice": "SLUDGE_JUICE",
  titanium: "TITANIUM_ORE",
  treasurite: "TREASURITE",
  tungsten: "TUNGSTEN",
  umber: "UMBER",
};

function chunk<T>(items: T[], size: number): T[][] {
  const parts: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    parts.push(items.slice(index, index + size));
  }
  return parts;
}

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

function extractAuctionCandidate(auction: Record<string, unknown>) {
  if (auction.bin !== true) {
    return null;
  }

  const itemName =
    typeof auction.item_name === "string" ? auction.item_name : null;
  const startingBid =
    typeof auction.starting_bid === "number" ? auction.starting_bid : null;

  if (!itemName || startingBid === null) {
    return null;
  }

  return {
    itemName,
    normalizedName: normalizeItemName(itemName),
    startingBid,
  };
}

async function syncBazaarSource(
  aliasRows: Array<{
    auctionMatchName: string;
    normalizedName: string;
    productId: string | null;
    sourcePriority: number;
  }>,
  relevantNames: Set<string>
) {
  const [bazaar, items] = await Promise.all([
    getSkyBlockBazaar(),
    getSkyBlockItems(),
  ]);

  const itemNameById = new Map(items.items.map((item) => [item.id, item.name]));
  const bazaarRows: Array<{
    buyOrderPrice: number | null;
    itemName: string;
    lastUpdated: number | null;
    productId: string;
    sellOfferPrice: number | null;
  }> = [];

  for (const [productId, product] of Object.entries(bazaar.products)) {
    const itemName =
      itemNameById.get(productId) ?? productId.replaceAll("_", " ");
    const variants = buildDisplayVariants(itemName);
    const matchesRelevant =
      variants.some((variant) => relevantNames.has(variant)) ||
      Object.values(MANUAL_PRODUCT_ALIASES).includes(productId);

    if (!matchesRelevant) {
      continue;
    }

    bazaarRows.push({
      productId,
      itemName,
      buyOrderPrice:
        product.buy_summary?.[0]?.pricePerUnit ??
        product.quick_status?.buyPrice ??
        null,
      sellOfferPrice:
        product.sell_summary?.[0]?.pricePerUnit ??
        product.quick_status?.sellPrice ??
        null,
      lastUpdated: bazaar.lastUpdated ?? null,
    });

    for (const variant of variants) {
      aliasRows.push({
        normalizedName: variant,
        auctionMatchName: variant,
        productId,
        sourcePriority: 10,
      });
    }
  }

  await replaceCurrentBazaarPrices(bazaarRows, {
    fetchedAt: Date.now(),
    hypixelLastUpdated: bazaar.lastUpdated ?? null,
  });

  return {
    bazaarRows,
  };
}

async function syncAuctionSource(relevantAuctionNames: Set<string>) {
  const firstAuctionPage = await getSkyBlockAuctions(0);
  const auctionPages = Array.from(
    { length: firstAuctionPage.totalPages - 1 },
    (_, index) => index + 1
  );
  const lowestBinByName = new Map<
    string,
    { displayName: string; lowestBin: number }
  >();

  const processAuctions = (auctions: Record<string, unknown>[]) => {
    for (const auction of auctions) {
      const candidate = extractAuctionCandidate(auction);
      if (!candidate) {
        continue;
      }

      if (!relevantAuctionNames.has(candidate.normalizedName)) {
        continue;
      }

      const current = lowestBinByName.get(candidate.normalizedName);
      if (!current || candidate.startingBid < current.lowestBin) {
        lowestBinByName.set(candidate.normalizedName, {
          displayName: candidate.itemName,
          lowestBin: candidate.startingBid,
        });
      }
    }
  };

  processAuctions(firstAuctionPage.auctions);

  for (const group of chunk(auctionPages, 6)) {
    const pages = await Promise.all(
      group.map((page) => getSkyBlockAuctions(page))
    );
    for (const page of pages) {
      processAuctions(page.auctions);
    }
  }

  const auctionRows = [...lowestBinByName.entries()].map(
    ([normalizedName, value]) => ({
      normalizedName,
      displayName: value.displayName,
      lowestBin: value.lowestBin,
      lastUpdated: firstAuctionPage.lastUpdated ?? null,
    })
  );

  await replaceCurrentAuctionPrices(auctionRows, {
    fetchedAt: Date.now(),
    hypixelLastUpdated: firstAuctionPage.lastUpdated ?? null,
  });

  return { auctionRows };
}

export async function syncPrices() {
  const syncRunId = await startSyncRun("prices");
  const relevantNames = new Set(getForgeRelevantItemNames());
  const recipes = getForgeRecipes();
  const aliasRows = recipeNamesToAliasRows(recipes);
  const meta: Record<string, unknown> = {
    recipes: recipes.length,
  };
  const failures: string[] = [];

  for (const [alias, productId] of Object.entries(MANUAL_PRODUCT_ALIASES)) {
    aliasRows.push({
      normalizedName: alias,
      auctionMatchName: alias,
      productId,
      sourcePriority: 1,
    });
  }

  try {
    try {
      const { bazaarRows } = await syncBazaarSource(aliasRows, relevantNames);
      meta.bazaarItems = bazaarRows.length;
      meta.bazaarStatus = "completed";
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown Bazaar sync failure.";
      failures.push(`Bazaar: ${message}`);
      meta.bazaarStatus = "failed";
      await markPriceSourceFailed("bazaar", message);
    }

    await upsertItemAliases(aliasRows);

    const relevantAuctionNames = new Set(
      aliasRows.map((row) => row.auctionMatchName)
    );

    try {
      const { auctionRows } = await syncAuctionSource(relevantAuctionNames);
      meta.auctionItems = auctionRows.length;
      meta.auctionStatus = "completed";
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown Auction sync failure.";
      failures.push(`Auction: ${message}`);
      meta.auctionStatus = "failed";
      await markPriceSourceFailed("auction", message);
    }

    if (failures.length > 0) {
      throw new Error(failures.join(" | "));
    }

    await finishSyncRun(syncRunId, "completed", meta);
  } catch (error) {
    await finishSyncRun(
      syncRunId,
      "failed",
      meta,
      error instanceof Error ? error.message : "Unknown sync failure."
    );
    throw error;
  }
}
