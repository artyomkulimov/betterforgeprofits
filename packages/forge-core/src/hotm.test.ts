import { describe, expect, it } from "vitest";
import {
  deriveHotmTierFromExp,
  effectiveForgeDuration,
  extractHotmTier,
  extractQuickForgeLevel,
  quickForgeReductionForLevel,
} from "./hotm";

describe("hotm", () => {
  it("returns the expected quick forge reduction values", () => {
    expect(quickForgeReductionForLevel(0)).toBe(0.1);
    expect(quickForgeReductionForLevel(10)).toBeCloseTo(0.15);
    expect(quickForgeReductionForLevel(50)).toBe(0.3);
  });

  it("applies quick forge reduction when calculating effective duration", () => {
    expect(effectiveForgeDuration(100_000, 10)).toBe(85_000);
    expect(effectiveForgeDuration(99_999, 3)).toBe(88_499);
  });

  it("derives hotm tiers from experience thresholds", () => {
    expect(deriveHotmTierFromExp(null)).toBeNull();
    expect(deriveHotmTierFromExp(-1)).toBeNull();
    expect(deriveHotmTierFromExp(0)).toBe(1);
    expect(deriveHotmTierFromExp(3000)).toBe(2);
    expect(deriveHotmTierFromExp(197_000)).toBe(6);
    expect(deriveHotmTierFromExp(999_999_999)).toBe(10);
  });

  it("extracts quick forge level from direct and nested structures", () => {
    expect(
      extractQuickForgeLevel({
        mining_core: { nodes: { quick_forge: 12 } },
      })
    ).toBe(12);

    expect(
      extractQuickForgeLevel({
        skill_tree: { nodes: { mining: { quick_forge: 7 } } },
      })
    ).toBe(7);

    expect(
      extractQuickForgeLevel({
        nested: { something: { quick_forge_bonus: 5, quick_forge: 9 } },
      })
    ).toBe(5);

    expect(extractQuickForgeLevel({})).toBe(0);
  });

  it("extracts hotm tier from direct tier fields or experience", () => {
    expect(
      extractHotmTier({ mining_core: { tier: 4, experience: 3000 } })
    ).toBe(4);

    expect(
      extractHotmTier({
        mining_core: { hotm_experience: 37_000 },
      })
    ).toBe(4);

    expect(
      extractHotmTier({
        skill_tree: {
          experience: { mining: 97_000 },
        },
      })
    ).toBe(5);

    expect(extractHotmTier({})).toBeNull();
  });
});
