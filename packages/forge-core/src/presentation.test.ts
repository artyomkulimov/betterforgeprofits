import { describe, expect, it } from "vitest";
import {
  getForgeBatchMetrics,
  getPreviousForgeStepDepth,
  isLowForgeTimeRow,
  isSimpleForgeRow,
  isSuspiciousForgeRow,
  LOW_FORGE_TIME_THRESHOLD_MS,
  sortForgeRows,
} from "./presentation";
import type { ForgeAnalysisRow } from "./types";

function createRow(
  overrides: Partial<ForgeAnalysisRow> = {},
  craftTree: ForgeAnalysisRow["craftTree"] = []
): ForgeAnalysisRow {
  return {
    baseDurationMs: 60_000,
    baseMaterialCost: 100,
    category: "Forging",
    craftTree,
    effectiveDurationMs: 60_000,
    hasForgeDependencies: false,
    hotmRequired: null,
    materialPriceDetails: [],
    materialPricingMode: "instant_buy",
    name: "Test Item",
    otherRequirements: [],
    outputCount: 1,
    outputPrice: { matchedId: "TEST", source: "bazaar", unitPrice: 250 },
    outputPriceDetail: null,
    outputPricingMode: "sell_offer",
    priceCoverage: "complete",
    profitPerCraft: 150,
    profitPerHour: 9000,
    quickForgeLevel: 0,
    quickForgeReduction: 0.1,
    rawMaterials: [
      {
        itemId: "MAT",
        name: "Material",
        quantity: 2,
        source: "bazaar",
        totalCost: 100,
        unitPrice: 50,
      },
    ],
    recipeId: "test-item",
    recursiveBaseDurationMs: 60_000,
    recursiveEffectiveDurationMs: 60_000,
    usesAhPricing: false,
    ...overrides,
  };
}

describe("presentation", () => {
  it("calculates batch metrics with bounded target amount and slot count", () => {
    const row = createRow({
      outputCount: 2,
      recursiveEffectiveDurationMs: 120_000,
    });

    const metrics = getForgeBatchMetrics(row, {
      targetAmount: 5,
      slotCount: 2,
    });

    expect(metrics.craftsNeeded).toBe(3);
    expect(metrics.totalOutput).toBe(6);
    expect(metrics.totalDurationMs).toBe(120_000);
    expect(metrics.totalRecursiveDurationMs).toBe(360_000);
    expect(metrics.totalMaterialCost).toBe(300);
    expect(metrics.totalOutputValue).toBe(1500);
    expect(metrics.totalProfit).toBe(1200);
    expect(metrics.scaledMaterials[0]).toMatchObject({
      quantity: 6,
      totalCost: 300,
    });
  });

  it("sorts rows by the requested sort mode", () => {
    const fast = createRow({
      name: "Fast",
      effectiveDurationMs: 30_000,
      profitPerCraft: 50,
      recursiveEffectiveDurationMs: 30_000,
    });
    const rich = createRow({
      name: "Rich",
      effectiveDurationMs: 120_000,
      profitPerCraft: 400,
      profitPerHour: 12_000,
      recursiveEffectiveDurationMs: 120_000,
    });
    const steady = createRow({
      name: "Steady",
      effectiveDurationMs: 60_000,
      profitPerCraft: 200,
      profitPerHour: 18_000,
      recursiveEffectiveDurationMs: 60_000,
    });

    expect(
      sortForgeRows([fast, rich, steady], "profit_per_craft", {
        targetAmount: 1,
        slotCount: 1,
      }).map((row) => row.name)
    ).toEqual(["Rich", "Steady", "Fast"]);

    expect(
      sortForgeRows([fast, rich, steady], "forge_time", {
        targetAmount: 1,
        slotCount: 1,
      }).map((row) => row.name)
    ).toEqual(["Fast", "Steady", "Rich"]);

    expect(
      sortForgeRows([fast, rich, steady], "profit_per_hour", {
        targetAmount: 1,
        slotCount: 1,
      }).map((row) => row.name)
    ).toEqual(["Fast", "Steady", "Rich"]);
  });

  it("detects suspicious and low-time rows", () => {
    const suspicious = createRow({
      baseMaterialCost: 100,
      outputPrice: { matchedId: "A", source: "bazaar", unitPrice: 700 },
      profitPerCraft: 600,
      recursiveEffectiveDurationMs: LOW_FORGE_TIME_THRESHOLD_MS - 1,
    });

    expect(
      isSuspiciousForgeRow(suspicious, { targetAmount: 1, slotCount: 1 })
    ).toBe(true);
    expect(
      isLowForgeTimeRow(suspicious, { targetAmount: 1, slotCount: 1 })
    ).toBe(true);
  });

  it("computes previous forge step depth and simple craft detection", () => {
    const simpleRow = createRow({}, [
      {
        children: [],
        effectiveForgeDurationMs: null,
        forgeDurationMs: null,
        isCraftable: false,
        itemId: "RAW",
        kind: "item",
        leafPriceDetail: null,
        name: "Raw",
        nodeId: "raw",
        quantity: 1,
        recipeId: null,
        subtotalCost: 10,
      },
    ]);

    const complexRow = createRow({}, [
      {
        children: [
          {
            children: [],
            effectiveForgeDurationMs: null,
            forgeDurationMs: null,
            isCraftable: true,
            itemId: "MID",
            kind: "item",
            leafPriceDetail: null,
            name: "Mid",
            nodeId: "mid",
            quantity: 1,
            recipeId: "mid",
            subtotalCost: 10,
          },
        ],
        effectiveForgeDurationMs: null,
        forgeDurationMs: null,
        isCraftable: true,
        itemId: "TOP",
        kind: "item",
        leafPriceDetail: null,
        name: "Top",
        nodeId: "top",
        quantity: 1,
        recipeId: "top",
        subtotalCost: 20,
      },
    ]);

    expect(getPreviousForgeStepDepth(simpleRow)).toBe(0);
    expect(isSimpleForgeRow(simpleRow)).toBe(true);
    expect(getPreviousForgeStepDepth(complexRow)).toBe(2);
    expect(isSimpleForgeRow(complexRow)).toBe(false);
  });
});
