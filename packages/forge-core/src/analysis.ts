import {
  effectiveForgeDuration,
  extractHotmTier,
  extractQuickForgeLevel,
  quickForgeReductionForLevel,
} from "./hotm";
import { getForgeRecipes, normalizeItemName } from "./recipes";
import type {
  AppliedPriceDetail,
  CraftTreeNode,
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
  treeNode: CraftTreeNode;
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

function sumKnownSubtotals(nodes: CraftTreeNode[]): number | null {
  if (nodes.some((node) => node.subtotalCost === null)) {
    return null;
  }

  return nodes.reduce((sum, node) => sum + (node.subtotalCost ?? 0), 0);
}

function sumRecursiveForgeDurations(nodes: CraftTreeNode[]): {
  baseDurationMs: number;
  effectiveDurationMs: number;
} {
  return nodes.reduce(
    (totals, node) => {
      const childTotals = sumRecursiveForgeDurations(node.children);
      const nodeBaseDuration =
        (node.forgeDurationMs ?? 0) * Math.max(node.quantity, 0);
      const nodeEffectiveDuration =
        (node.effectiveForgeDurationMs ?? 0) * Math.max(node.quantity, 0);

      return {
        baseDurationMs:
          totals.baseDurationMs + nodeBaseDuration + childTotals.baseDurationMs,
        effectiveDurationMs:
          totals.effectiveDurationMs +
          nodeEffectiveDuration +
          childTotals.effectiveDurationMs,
      };
    },
    { baseDurationMs: 0, effectiveDurationMs: 0 }
  );
}

function toCraftNodeDurations(
  recipe: ForgeRecipe | null,
  quickForgeLevel: number
) {
  return {
    forgeDurationMs: recipe?.durationMs ?? null,
    effectiveForgeDurationMs:
      recipe === null
        ? null
        : effectiveForgeDuration(recipe.durationMs, quickForgeLevel),
  };
}

function buildCraftTreeNode({
  children,
  craftableRecipe,
  ingredient,
  isCraftable,
  path,
  quantity,
  quickForgeLevel,
}: {
  children: CraftTreeNode[];
  craftableRecipe: ForgeRecipe | null;
  ingredient: RecipeIngredient;
  isCraftable: boolean;
  path: string;
  quantity: number;
  quickForgeLevel: number;
}): CraftTreeNode {
  return {
    nodeId: path,
    name: ingredient.name,
    kind: "item",
    quantity,
    itemId: ingredient.itemId,
    recipeId: craftableRecipe?.id ?? null,
    ...toCraftNodeDurations(craftableRecipe, quickForgeLevel),
    isCraftable,
    subtotalCost: sumKnownSubtotals(children),
    leafPriceDetail: null,
    children,
  };
}

async function expandIngredientChildren(
  ingredient: RecipeIngredient,
  quantity: number,
  path: string,
  recipeNameIndex: Map<string, ForgeRecipe>,
  allowAuction: boolean,
  materialPricing: MaterialPricingMode,
  priceRepository: PriceRepository,
  quickForgeLevel: number
) {
  let usesAhPricing = false;
  let hasForgeDependencies = false;
  const materials: ExpandedMaterial[] = [];
  const childNodes: CraftTreeNode[] = [];

  for (const [index, child] of (ingredient.children ?? []).entries()) {
    const expanded = await expandIngredientTree(
      child,
      quantity,
      `${path}.${index}`,
      recipeNameIndex,
      allowAuction,
      materialPricing,
      priceRepository,
      quickForgeLevel
    );
    usesAhPricing ||= expanded.usesAhPricing;
    hasForgeDependencies ||= expanded.hasForgeDependencies;
    materials.push(...expanded.materials);
    childNodes.push(expanded.treeNode);
  }

  return {
    materials,
    childNodes,
    usesAhPricing,
    hasForgeDependencies,
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
  path: string,
  recipeNameIndex: Map<string, ForgeRecipe>,
  allowAuction: boolean,
  materialPricing: MaterialPricingMode,
  priceRepository: PriceRepository,
  quickForgeLevel: number
): Promise<ExpandedResult> {
  const quantity = ingredient.quantity * quantityMultiplier;
  const craftableRecipe =
    recipeNameIndex.get(normalizeItemName(ingredient.name)) ?? null;
  const isForgeDependency = craftableRecipe !== null;

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
      treeNode: {
        nodeId: path,
        name: ingredient.name,
        kind: "coins",
        quantity,
        itemId: "COINS",
        recipeId: null,
        forgeDurationMs: null,
        effectiveForgeDurationMs: null,
        isCraftable: false,
        subtotalCost: quantity,
        leafPriceDetail: {
          matchedId: "COINS",
          source: "coins",
          totalCost: quantity,
          unitPrice: 1,
        },
        children: [],
      },
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
    const expandedChildren = await expandIngredientChildren(
      ingredient,
      quantity,
      path,
      recipeNameIndex,
      allowAuction,
      materialPricing,
      priceRepository,
      quickForgeLevel
    );

    return {
      materials: expandedChildren.materials,
      treeNode: buildCraftTreeNode({
        children: expandedChildren.childNodes,
        craftableRecipe,
        ingredient,
        isCraftable: true,
        path,
        quantity,
        quickForgeLevel,
      }),
      coverage: deriveCoverage(
        expandedChildren.materials.map((material) => material.unitPrice)
      ),
      usesAhPricing: expandedChildren.usesAhPricing,
      hasForgeDependencies:
        isForgeDependency || expandedChildren.hasForgeDependencies,
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
    const expandedChildren = await expandIngredientChildren(
      ingredient,
      quantity,
      path,
      recipeNameIndex,
      allowAuction,
      materialPricing,
      priceRepository,
      quickForgeLevel
    );

    return {
      materials: expandedChildren.materials,
      treeNode: buildCraftTreeNode({
        children: expandedChildren.childNodes,
        craftableRecipe,
        ingredient,
        isCraftable: Boolean(ingredient.children.length),
        path,
        quantity,
        quickForgeLevel,
      }),
      coverage: deriveCoverage(
        expandedChildren.materials.map((material) => material.unitPrice)
      ),
      usesAhPricing: expandedChildren.usesAhPricing,
      hasForgeDependencies:
        isForgeDependency || expandedChildren.hasForgeDependencies,
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
    treeNode: {
      nodeId: path,
      name: ingredient.name,
      kind: "item",
      quantity,
      itemId: quote?.matchedId ?? ingredient.itemId,
      recipeId: null,
      forgeDurationMs: null,
      effectiveForgeDurationMs: null,
      isCraftable: false,
      subtotalCost: quote ? quote.unitPrice * quantity : null,
      leafPriceDetail: {
        matchedId: quote?.matchedId ?? ingredient.itemId,
        source,
        totalCost: quote ? quote.unitPrice * quantity : null,
        unitPrice: quote?.unitPrice ?? null,
      },
      children: [],
    },
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
  const craftTree: CraftTreeNode[] = [];

  for (const [index, ingredient] of recipe.ingredients.entries()) {
    const expanded = await expandIngredientTree(
      ingredient,
      1,
      `${recipe.id}.${index}`,
      recipeNameIndex,
      allowAh,
      materialPricing,
      priceRepository,
      quickForgeLevel
    );
    usesAhPricing ||= expanded.usesAhPricing;
    hasForgeDependencies ||= expanded.hasForgeDependencies;
    materials.push(...expanded.materials);
    craftTree.push(expanded.treeNode);
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
  const recursiveTreeDurations = sumRecursiveForgeDurations(craftTree);
  const recursiveBaseDurationMs =
    recipe.durationMs + recursiveTreeDurations.baseDurationMs;
  const recursiveEffectiveDurationMs =
    effectiveDurationMs + recursiveTreeDurations.effectiveDurationMs;
  const profitPerHour =
    profitPerCraft !== null && effectiveDurationMs > 0
      ? profitPerCraft / (effectiveDurationMs / 3_600_000)
      : null;

  return {
    recipeId: recipe.id,
    name: recipe.name,
    category: recipe.category,
    craftTree,
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
    recursiveBaseDurationMs,
    recursiveEffectiveDurationMs,
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
