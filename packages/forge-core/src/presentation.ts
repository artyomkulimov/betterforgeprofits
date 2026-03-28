import type {
  CraftTreeNode,
  ExpandedMaterial,
  ForgeAnalysisRow,
  SortMode,
} from "./types";

export interface ForgeBatchSettings {
  slotCount: number;
  targetAmount: number;
}

export interface ForgeBatchMetrics {
  craftsNeeded: number;
  scaledMaterials: ExpandedMaterial[];
  totalDurationMs: number;
  totalMaterialCost: number | null;
  totalOutput: number;
  totalOutputValue: number | null;
  totalProfit: number | null;
  totalProfitPerHour: number | null;
  totalRecursiveDurationMs: number;
}

export const SUSPICIOUS_PROFIT_MULTIPLIER_THRESHOLD = 4;
export const LOW_FORGE_TIME_THRESHOLD_MS = 30 * 60_000;
export const SIMPLE_CRAFT_MAX_PREVIOUS_STEPS = 1;

function clampInteger(
  value: number,
  fallback: number,
  min: number,
  max: number
): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.floor(value)));
}

export function getForgeBatchMetrics(
  row: ForgeAnalysisRow,
  settings: ForgeBatchSettings
): ForgeBatchMetrics {
  const targetAmount = clampInteger(settings.targetAmount, 1, 1, 999_999);
  const slotCount = clampInteger(settings.slotCount, 1, 1, 7);
  const craftsNeeded = Math.max(
    1,
    Math.ceil(targetAmount / Math.max(row.outputCount, 1))
  );
  const totalOutput = craftsNeeded * row.outputCount;
  const totalDurationMs =
    Math.ceil(craftsNeeded / slotCount) * row.effectiveDurationMs;
  const totalRecursiveDurationMs =
    craftsNeeded * row.recursiveEffectiveDurationMs;
  const totalMaterialCost =
    row.baseMaterialCost === null ? null : row.baseMaterialCost * craftsNeeded;
  const totalOutputValue =
    row.outputPrice === null
      ? null
      : row.outputPrice.unitPrice * row.outputCount * craftsNeeded;
  const totalProfit =
    totalMaterialCost !== null && totalOutputValue !== null
      ? totalOutputValue - totalMaterialCost
      : null;
  const totalProfitPerHour =
    totalProfit !== null && totalRecursiveDurationMs > 0
      ? totalProfit / (totalRecursiveDurationMs / 3_600_000)
      : null;
  const scaledMaterials = row.rawMaterials.map((material) => ({
    ...material,
    quantity: material.quantity * craftsNeeded,
    totalCost:
      material.totalCost === null ? null : material.totalCost * craftsNeeded,
  }));

  return {
    craftsNeeded,
    totalOutput,
    totalDurationMs,
    totalRecursiveDurationMs,
    totalMaterialCost,
    totalOutputValue,
    totalProfit,
    totalProfitPerHour,
    scaledMaterials,
  };
}

export function sortForgeRows(
  rows: ForgeAnalysisRow[],
  sortMode: SortMode,
  settings: ForgeBatchSettings
): ForgeAnalysisRow[] {
  const sorted = [...rows];

  sorted.sort((left, right) => {
    const leftMetrics = getForgeBatchMetrics(left, settings);
    const rightMetrics = getForgeBatchMetrics(right, settings);

    if (sortMode === "profit_per_craft") {
      return (
        (right.profitPerCraft ?? Number.NEGATIVE_INFINITY) -
        (left.profitPerCraft ?? Number.NEGATIVE_INFINITY)
      );
    }

    if (sortMode === "forge_time") {
      return leftMetrics.totalDurationMs - rightMetrics.totalDurationMs;
    }

    return (
      (rightMetrics.totalProfitPerHour ?? Number.NEGATIVE_INFINITY) -
      (leftMetrics.totalProfitPerHour ?? Number.NEGATIVE_INFINITY)
    );
  });

  return sorted;
}

export function isSuspiciousForgeRow(
  row: ForgeAnalysisRow,
  settings: ForgeBatchSettings
): boolean {
  const metrics = getForgeBatchMetrics(row, settings);

  if (
    metrics.totalMaterialCost === null ||
    metrics.totalProfit === null ||
    metrics.totalMaterialCost <= 0 ||
    metrics.totalProfit <= 0
  ) {
    return false;
  }

  return (
    metrics.totalProfit / metrics.totalMaterialCost >
    SUSPICIOUS_PROFIT_MULTIPLIER_THRESHOLD
  );
}

export function isLowForgeTimeRow(
  row: ForgeAnalysisRow,
  settings: ForgeBatchSettings
): boolean {
  const metrics = getForgeBatchMetrics(row, settings);
  return metrics.totalRecursiveDurationMs < LOW_FORGE_TIME_THRESHOLD_MS;
}

function getCraftTreeForgeDepth(node: CraftTreeNode): number {
  const childDepth = Math.max(
    0,
    ...node.children.map((child) => getCraftTreeForgeDepth(child))
  );

  if (!node.isCraftable) {
    return childDepth;
  }

  return 1 + childDepth;
}

export function getPreviousForgeStepDepth(row: ForgeAnalysisRow): number {
  return Math.max(
    0,
    ...row.craftTree.map((node) => getCraftTreeForgeDepth(node))
  );
}

export function isSimpleForgeRow(row: ForgeAnalysisRow): boolean {
  return getPreviousForgeStepDepth(row) <= SIMPLE_CRAFT_MAX_PREVIOUS_STEPS;
}
