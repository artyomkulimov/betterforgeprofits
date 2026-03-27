import {
  effectiveForgeDuration,
  extractHotmTier,
  extractQuickForgeLevel,
  quickForgeReductionForLevel,
} from "./hotm";
import { getForgeRecipes, normalizeItemName } from "./recipes";
import type {
  AppliedPriceDetail,
  ExpandedMaterial,
  ForgeAnalysisResponse,
  ForgeAnalysisRow,
  ForgeProfileSummary,
  ForgeRecipe,
  MaterialPricingMode,
  OutputPricingMode,
  PriceCoverage,
  PriceQuote,
  PriceRepository,
  RecipeIngredient,
} from "./types";

interface AnalysisOptions {
  allowAh: boolean;
  hotmOverride?: number | null;
  materialPricing: MaterialPricingMode;
  onRecipeTiming?: (timing: {
    durationMs: number;
    name: string;
    priceCoverage: PriceCoverage;
    profitPerCraft: number | null;
    recipeId: string;
  }) => void;
  outputPricing: OutputPricingMode;
  playerUuid: string;
  priceRepository: PriceRepository;
  profileId: string;
  profiles: Record<string, unknown>[];
  quickForgeOverride?: number | null;
}

interface CollectionRequirement {
  collection: string;
  tier: number;
}

interface ExpandedResult {
  coverage: PriceCoverage;
  hasForgeDependencies: boolean;
  materials: ExpandedMaterial[];
  usesAhPricing: boolean;
}

const UNLOCKED_COLLECTION_TIER_PATTERN = /^(.*)_(-?\d+)$/;
const COLLECTION_REQUIREMENT_PATTERN = /^(.+?) Collection ([IVX]+)$/i;

function normalizeUuid(value: string): string {
  return value.replace(/-/g, "").toLowerCase();
}

function resolveProfileMember(
  profile: Record<string, unknown>,
  playerUuid: string
) {
  const members = profile.members;
  if (!members || typeof members !== "object") {
    return null;
  }

  const normalizedTarget = normalizeUuid(playerUuid);
  for (const [memberUuid, member] of Object.entries(members)) {
    if (normalizeUuid(memberUuid) === normalizedTarget) {
      return member;
    }
  }

  return null;
}

export function summarizeProfiles(
  profiles: Record<string, unknown>[],
  playerUuid: string
): ForgeProfileSummary[] {
  return profiles
    .map((profile) => {
      const member = resolveProfileMember(profile, playerUuid);
      const quickForgeLevel = extractQuickForgeLevel(member);
      const hotmTier = extractHotmTier(member);
      const profileId =
        typeof profile.profile_id === "string" ? profile.profile_id : "";
      const cuteName =
        typeof profile.cute_name === "string" ? profile.cute_name : null;
      const selected = profile.selected === true;
      const lastSave =
        member &&
        typeof member === "object" &&
        typeof (member as { last_save?: unknown }).last_save === "number"
          ? ((member as { last_save: number }).last_save ?? null)
          : null;

      return {
        profileId,
        cuteName,
        selected,
        hotmTier,
        quickForgeLevel,
        quickForgeReduction: quickForgeReductionForLevel(quickForgeLevel),
        lastSave,
      };
    })
    .filter((profile) => Boolean(profile.profileId));
}

export function selectDefaultProfile(
  profiles: ForgeProfileSummary[]
): ForgeProfileSummary | null {
  if (profiles.length === 0) {
    return null;
  }

  const selected = profiles.find((profile) => profile.selected);
  if (selected) {
    return selected;
  }

  return (
    [...profiles].sort(
      (left, right) => (right.lastSave ?? 0) - (left.lastSave ?? 0)
    )[0] ?? null
  );
}

function deriveCoverage(
  values: Array<number | null | undefined>
): PriceCoverage {
  const presentCount = values.filter(
    (value) => typeof value === "number"
  ).length;
  if (presentCount === 0) {
    return "missing";
  }
  if (presentCount === values.length) {
    return "complete";
  }
  return "partial";
}

function romanToInt(value: string): number {
  const numerals: Record<string, number> = { I: 1, V: 5, X: 10 };
  let total = 0;
  let previous = 0;

  for (const character of value.toUpperCase().split("").reverse()) {
    const current = numerals[character] ?? 0;
    if (current < previous) {
      total -= current;
    } else {
      total += current;
      previous = current;
    }
  }

  return total;
}

function normalizeCollectionName(name: string): string {
  return name.trim().toUpperCase().replace(/['’.]/g, "").replace(/\s+/g, "_");
}

function extractUnlockedCollectionTiers(member: unknown): Map<string, number> {
  const tiers = new Map<string, number>();
  const unlocked = (
    member as { player_data?: { unlocked_coll_tiers?: unknown } }
  )?.player_data?.unlocked_coll_tiers;

  if (!Array.isArray(unlocked)) {
    return tiers;
  }

  for (const rawEntry of unlocked) {
    if (typeof rawEntry !== "string") {
      continue;
    }

    const match = rawEntry.match(UNLOCKED_COLLECTION_TIER_PATTERN);
    if (!match) {
      continue;
    }

    const key = match[1];
    const tier = Number(match[2]);
    if (Number.isNaN(tier) || tier < 0) {
      continue;
    }

    const current = tiers.get(key) ?? 0;
    if (tier > current) {
      tiers.set(key, tier);
    }
  }

  return tiers;
}

function parseCollectionRequirements(
  requirements: string[]
): CollectionRequirement[] {
  return requirements
    .map((entry) => {
      const match = entry.match(COLLECTION_REQUIREMENT_PATTERN);
      if (!match) {
        return null;
      }

      return {
        collection: normalizeCollectionName(match[1]),
        tier: romanToInt(match[2]),
      };
    })
    .filter((value): value is CollectionRequirement => value !== null);
}

function meetsCollectionRequirements(
  recipe: ForgeRecipe,
  unlockedCollectionTiers: Map<string, number>
): boolean {
  const requirements = parseCollectionRequirements(recipe.requirements.text);
  if (requirements.length === 0) {
    return true;
  }

  return requirements.every((requirement) => {
    const unlockedTier =
      unlockedCollectionTiers.get(requirement.collection) ?? 0;
    return unlockedTier >= requirement.tier;
  });
}

function aggregateMaterials(materials: ExpandedMaterial[]): ExpandedMaterial[] {
  const grouped = new Map<string, ExpandedMaterial>();

  for (const material of materials) {
    const key = `${material.source}:${material.name.toLowerCase()}`;
    const current = grouped.get(key);
    if (current) {
      current.quantity += material.quantity;
      current.totalCost =
        current.totalCost !== null && material.totalCost !== null
          ? current.totalCost + material.totalCost
          : null;
      continue;
    }

    grouped.set(key, { ...material });
  }

  return [...grouped.values()].sort(
    (left, right) => right.quantity - left.quantity
  );
}

function toAppliedPriceDetail(material: ExpandedMaterial): AppliedPriceDetail {
  return {
    itemId: material.itemId,
    matchedId: material.itemId,
    name: material.name,
    quantity: material.quantity,
    source: material.source,
    totalCost: material.totalCost,
    unitPrice: material.unitPrice,
  };
}

async function quoteLeaf(
  name: string,
  allowAuction: boolean,
  materialPricing: MaterialPricingMode,
  priceRepository: PriceRepository
): Promise<PriceQuote | null> {
  const bazaarQuote = await priceRepository.getBazaarQuoteByName(
    name,
    materialPricing
  );
  if (bazaarQuote) {
    return bazaarQuote;
  }

  if (!allowAuction) {
    return null;
  }

  return priceRepository.getAuctionQuoteByName(name);
}

async function quoteOutput(
  name: string,
  outputPricing: OutputPricingMode,
  allowAuction: boolean,
  priceRepository: PriceRepository
): Promise<PriceQuote | null> {
  const bazaarQuote = await priceRepository.getBazaarQuoteByName(
    name,
    outputPricing
  );
  if (bazaarQuote) {
    return bazaarQuote;
  }

  if (!allowAuction) {
    return null;
  }

  return priceRepository.getAuctionQuoteByName(name);
}

async function expandIngredientTree(
  ingredient: RecipeIngredient,
  quantityMultiplier: number,
  recipeNameIndex: Map<string, ForgeRecipe>,
  allowAuction: boolean,
  materialPricing: MaterialPricingMode,
  priceRepository: PriceRepository
): Promise<ExpandedResult> {
  const quantity = ingredient.quantity * quantityMultiplier;
  const isForgeDependency = recipeNameIndex.has(
    normalizeItemName(ingredient.name)
  );

  if (ingredient.kind === "coins") {
    return {
      materials: [
        {
          itemId: "COINS",
          name: "Coins",
          quantity,
          unitPrice: 1,
          source: "coins",
          totalCost: quantity,
        },
      ],
      coverage: "complete",
      usesAhPricing: false,
      hasForgeDependencies: isForgeDependency,
    };
  }

  if (
    isForgeDependency &&
    ingredient.children &&
    ingredient.children.length > 0
  ) {
    let usesAhPricing = false;
    let hasForgeDependencies: boolean = isForgeDependency;
    const materials: ExpandedMaterial[] = [];

    for (const child of ingredient.children) {
      const expanded = await expandIngredientTree(
        child,
        quantity,
        recipeNameIndex,
        allowAuction,
        materialPricing,
        priceRepository
      );
      usesAhPricing ||= expanded.usesAhPricing;
      hasForgeDependencies ||= expanded.hasForgeDependencies;
      materials.push(...expanded.materials);
    }

    return {
      materials,
      coverage: deriveCoverage(materials.map((material) => material.unitPrice)),
      usesAhPricing,
      hasForgeDependencies,
    };
  }

  const quote = await quoteLeaf(
    ingredient.name,
    allowAuction,
    materialPricing,
    priceRepository
  );
  const source = quote?.source ?? "unknown";

  if (!quote && ingredient.children && ingredient.children.length > 0) {
    let usesAhPricing = false;
    let hasForgeDependencies: boolean = isForgeDependency;
    const materials: ExpandedMaterial[] = [];

    for (const child of ingredient.children) {
      const expanded = await expandIngredientTree(
        child,
        quantity,
        recipeNameIndex,
        allowAuction,
        materialPricing,
        priceRepository
      );
      usesAhPricing ||= expanded.usesAhPricing;
      hasForgeDependencies ||= expanded.hasForgeDependencies;
      materials.push(...expanded.materials);
    }

    return {
      materials,
      coverage: deriveCoverage(materials.map((material) => material.unitPrice)),
      usesAhPricing,
      hasForgeDependencies,
    };
  }

  return {
    materials: [
      {
        itemId: quote?.matchedId ?? ingredient.itemId,
        name: ingredient.name,
        quantity,
        unitPrice: quote?.unitPrice ?? null,
        source,
        totalCost: quote ? quote.unitPrice * quantity : null,
      },
    ],
    coverage: quote ? "complete" : "missing",
    usesAhPricing: quote?.source === "auction",
    hasForgeDependencies: isForgeDependency,
  };
}

async function analyzeRecipe(
  recipe: ForgeRecipe,
  quickForgeLevel: number,
  recipeNameIndex: Map<string, ForgeRecipe>,
  materialPricing: MaterialPricingMode,
  outputPricing: OutputPricingMode,
  allowAh: boolean,
  priceRepository: PriceRepository
): Promise<ForgeAnalysisRow> {
  let usesAhPricing = false;
  let hasForgeDependencies = false;
  const materials: ExpandedMaterial[] = [];

  for (const ingredient of recipe.ingredients) {
    const expanded = await expandIngredientTree(
      ingredient,
      1,
      recipeNameIndex,
      allowAh,
      materialPricing,
      priceRepository
    );
    usesAhPricing ||= expanded.usesAhPricing;
    hasForgeDependencies ||= expanded.hasForgeDependencies;
    materials.push(...expanded.materials);
  }

  const aggregatedMaterials = aggregateMaterials(materials);
  let coverage = deriveCoverage(
    aggregatedMaterials.map((material) => material.unitPrice)
  );
  const baseMaterialCost = aggregatedMaterials.every(
    (material) => material.totalCost !== null
  )
    ? aggregatedMaterials.reduce(
        (sum, material) => sum + (material.totalCost ?? 0),
        0
      )
    : null;

  const outputPrice = await quoteOutput(
    recipe.output.name,
    outputPricing,
    allowAh,
    priceRepository
  );
  if (outputPrice) {
    usesAhPricing ||= outputPrice.source === "auction";
  } else {
    coverage = aggregatedMaterials.length === 0 ? "missing" : "partial";
  }

  const outputValue = outputPrice
    ? outputPrice.unitPrice * recipe.output.quantity
    : null;
  const profitPerCraft =
    outputValue !== null && baseMaterialCost !== null
      ? outputValue - baseMaterialCost
      : null;
  const effectiveDurationMs = effectiveForgeDuration(
    recipe.durationMs,
    quickForgeLevel
  );
  const profitPerHour =
    profitPerCraft !== null && effectiveDurationMs > 0
      ? profitPerCraft / (effectiveDurationMs / 3_600_000)
      : null;

  return {
    recipeId: recipe.id,
    name: recipe.name,
    category: recipe.category,
    hotmRequired: recipe.requirements.hotmTier,
    materialPricingMode: materialPricing,
    otherRequirements: recipe.requirements.text,
    baseDurationMs: recipe.durationMs,
    effectiveDurationMs,
    quickForgeLevel,
    quickForgeReduction: quickForgeReductionForLevel(quickForgeLevel),
    outputCount: recipe.output.quantity,
    outputPrice,
    outputPriceDetail: outputPrice
      ? {
          itemId: recipe.output.itemId,
          matchedId: outputPrice.matchedId,
          name: recipe.output.name,
          quantity: recipe.output.quantity,
          source: outputPrice.source,
          totalCost: outputValue,
          unitPrice: outputPrice.unitPrice,
        }
      : null,
    outputPricingMode: outputPricing,
    baseMaterialCost,
    profitPerCraft,
    profitPerHour,
    usesAhPricing,
    hasForgeDependencies,
    priceCoverage: coverage,
    materialPriceDetails: aggregatedMaterials.map(toAppliedPriceDetail),
    rawMaterials: aggregatedMaterials,
  };
}

export async function analyzeForge({
  profileId,
  profiles,
  playerUuid,
  materialPricing,
  outputPricing,
  allowAh,
  hotmOverride,
  onRecipeTiming,
  quickForgeOverride,
  priceRepository,
}: AnalysisOptions): Promise<ForgeAnalysisResponse> {
  const profileSummaries = summarizeProfiles(profiles, playerUuid);
  const selectedProfile = profileSummaries.find(
    (profile) => profile.profileId === profileId
  );

  if (!selectedProfile) {
    throw new Error("Selected profile not found.");
  }

  if (selectedProfile.hotmTier === null) {
    throw new Error("Mining data is unavailable for the selected profile.");
  }

  const effectiveHotmTier = hotmOverride ?? selectedProfile.hotmTier;
  const effectiveQuickForgeLevel =
    quickForgeOverride ?? selectedProfile.quickForgeLevel;

  const rawProfile = profiles.find(
    (profile) => profile.profile_id === profileId
  );
  const selectedMember = rawProfile
    ? resolveProfileMember(rawProfile, playerUuid)
    : null;
  const unlockedCollectionTiers =
    extractUnlockedCollectionTiers(selectedMember);

  const recipes = getForgeRecipes();
  const recipeNameIndex = new Map(
    recipes.map((recipe) => [normalizeItemName(recipe.output.name), recipe])
  );

  const eligibleRecipes = recipes.filter(
    (recipe) =>
      (recipe.requirements.hotmTier === null ||
        recipe.requirements.hotmTier <= effectiveHotmTier) &&
      meetsCollectionRequirements(recipe, unlockedCollectionTiers)
  );

  const rows = await Promise.all(
    eligibleRecipes.map(async (recipe) => {
      const startedAt = performance.now();
      const row = await analyzeRecipe(
        recipe,
        effectiveQuickForgeLevel,
        recipeNameIndex,
        materialPricing,
        outputPricing,
        allowAh,
        priceRepository
      );
      onRecipeTiming?.({
        recipeId: recipe.id,
        name: recipe.name,
        durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
        priceCoverage: row.priceCoverage,
        profitPerCraft: row.profitPerCraft,
      });
      return row;
    })
  );

  return {
    profile: {
      ...selectedProfile,
      hotmTier: effectiveHotmTier,
      quickForgeLevel: effectiveQuickForgeLevel,
      quickForgeReduction: quickForgeReductionForLevel(
        effectiveQuickForgeLevel
      ),
    },
    pricingMeta: await priceRepository.getFreshnessMeta(),
    rows: rows.filter(
      (row) => row.priceCoverage === "complete" && (row.profitPerCraft ?? 0) > 0
    ),
  };
}
