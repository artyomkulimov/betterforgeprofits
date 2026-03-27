import type { ForgeAnalysisRow, ForgeTabDefinition } from "./types";

function compareNullableNumbers(
  left: number | null,
  right: number | null
): number {
  const safeLeft = left ?? Number.NEGATIVE_INFINITY;
  const safeRight = right ?? Number.NEGATIVE_INFINITY;
  return safeRight - safeLeft;
}

function isRankable(row: ForgeAnalysisRow): boolean {
  return (
    row.priceCoverage === "complete" &&
    row.profitPerCraft !== null &&
    row.baseMaterialCost !== null
  );
}

function isProfitable(row: ForgeAnalysisRow): boolean {
  return isRankable(row) && (row.profitPerCraft ?? 0) > 0;
}

export const forgeTabs: ForgeTabDefinition[] = [
  {
    id: "highest-profit",
    label: "Highest Profit",
    description:
      "Best profit per finished forge item using only complete Bazaar-backed pricing.",
    disclaimer:
      "Profit is calculated from base material cost only. Forged intermediates are recursively reduced into raw leaves before pricing.",
    include: (row) => isProfitable(row) && !row.usesAhPricing,
    sort: (left, right) =>
      compareNullableNumbers(left.profitPerHour, right.profitPerHour) ||
      compareNullableNumbers(left.profitPerCraft, right.profitPerCraft),
  },
  {
    id: "raw-crafts",
    label: "Raw Crafts",
    description:
      "Fast reads on recipes with no forge dependencies anywhere in the ingredient chain.",
    disclaimer:
      "Only recipes with no forge dependency in their ingredient chain appear here. Costs still use fully expanded base materials.",
    include: (row) =>
      isProfitable(row) && !row.usesAhPricing && !row.hasForgeDependencies,
    sort: (left, right) =>
      compareNullableNumbers(left.profitPerHour, right.profitPerHour) ||
      compareNullableNumbers(left.profitPerCraft, right.profitPerCraft) ||
      left.effectiveDurationMs - right.effectiveDurationMs,
  },
  {
    id: "ah-materials",
    label: "AH Materials",
    description: "Recipes that need auction-priced leaves or outputs.",
    disclaimer:
      "Auction pricing uses the lowest active BIN from the official Hypixel auctions endpoint and can move quickly.",
    include: (row) => isProfitable(row) && row.usesAhPricing,
    sort: (left, right) =>
      compareNullableNumbers(left.profitPerHour, right.profitPerHour) ||
      compareNullableNumbers(left.profitPerCraft, right.profitPerCraft),
  },
];

export function buildTabPayload(rows: ForgeAnalysisRow[]) {
  return Object.fromEntries(
    forgeTabs.map((tab) => [tab.id, rows.filter(tab.include).sort(tab.sort)])
  ) as Record<ForgeTabDefinition["id"], ForgeAnalysisRow[]>;
}
