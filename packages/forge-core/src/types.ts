export type ForgeCategory =
  | "Refining"
  | "Forging"
  | "Tools"
  | "Gear"
  | "Reforge Stones"
  | "Drill Parts"
  | "Perfect Gemstones"
  | "Pets"
  | "Other";

export interface RecipeIngredient {
  children?: RecipeIngredient[];
  itemId: string | null;
  kind: "item" | "coins";
  name: string;
  quantity: number;
}

export interface ForgeRecipe {
  category: ForgeCategory;
  directIngredients: RecipeIngredient[];
  durationMs: number;
  id: string;
  ingredients: RecipeIngredient[];
  name: string;
  output: {
    itemId: string | null;
    name: string;
    quantity: number;
  };
  requirements: {
    hotmTier: number | null;
    text: string[];
  };
}

export interface PriceQuote {
  matchedId: string | null;
  source: "bazaar" | "auction" | "coins";
  unitPrice: number;
}

export interface PriceFreshnessMeta {
  auctionSnapshotFetchedAt: number | null;
  bazaarSnapshotFetchedAt: number | null;
  snapshotAgeSeconds: number | null;
}

export interface BazaarSnapshotEntry {
  buyOrderPrice: number | null;
  productId: string;
  sellOfferPrice: number | null;
}

export interface AuctionSnapshotEntry {
  lowestBin: number;
  normalizedName: string;
}

export interface AliasSnapshotEntry {
  auctionMatchName: string;
  normalizedName: string;
  productId: string | null;
  sourcePriority: number;
}

export interface CurrentPricingSnapshot {
  aliases: AliasSnapshotEntry[];
  auction: AuctionSnapshotEntry[];
  bazaar: BazaarSnapshotEntry[];
  freshnessMeta: PriceFreshnessMeta;
}

export interface PriceRepository {
  getAuctionQuoteByName(name: string): Promise<PriceQuote | null>;
  getBazaarQuoteByName(
    name: string,
    mode: MaterialPricingMode | OutputPricingMode
  ): Promise<PriceQuote | null>;
  getFreshnessMeta(): Promise<PriceFreshnessMeta>;
  preloadCurrentPricing?(): Promise<CurrentPricingSnapshot>;
}

export type MaterialPricingMode = "instant_buy" | "buy_order";
export type OutputPricingMode = "sell_offer" | "instant_sell";
export type SortMode = "profit_per_hour" | "profit_per_craft" | "forge_time";

export interface ExpandedMaterial {
  itemId: string | null;
  name: string;
  quantity: number;
  source: PriceQuote["source"] | "unknown";
  totalCost: number | null;
  unitPrice: number | null;
}

export interface AppliedPriceDetail {
  itemId: string | null;
  matchedId: string | null;
  name: string;
  quantity: number;
  source: PriceQuote["source"] | "unknown";
  totalCost: number | null;
  unitPrice: number | null;
}

export type PriceCoverage = "complete" | "partial" | "missing";

export interface ForgeAnalysisRow {
  baseDurationMs: number;
  baseMaterialCost: number | null;
  category: ForgeCategory;
  effectiveDurationMs: number;
  hasForgeDependencies: boolean;
  hotmRequired: number | null;
  materialPriceDetails: AppliedPriceDetail[];
  materialPricingMode: MaterialPricingMode;
  name: string;
  otherRequirements: string[];
  outputCount: number;
  outputPrice: PriceQuote | null;
  outputPriceDetail: AppliedPriceDetail | null;
  outputPricingMode: OutputPricingMode;
  priceCoverage: PriceCoverage;
  profitPerCraft: number | null;
  profitPerHour: number | null;
  quickForgeLevel: number;
  quickForgeReduction: number;
  rawMaterials: ExpandedMaterial[];
  recipeId: string;
  usesAhPricing: boolean;
}

export interface ForgeProfileSummary {
  cuteName: string | null;
  hotmTier: number | null;
  lastSave: number | null;
  profileId: string;
  quickForgeLevel: number;
  quickForgeReduction: number;
  selected: boolean;
}

export interface ForgeProfileContextResponse {
  player: { username: string; uuid: string };
  profile: ForgeProfileSummary;
  profiles: ForgeProfileSummary[];
  selectedProfileId: string;
}

export interface ForgeAnalysisResponse {
  pricingMeta: PriceFreshnessMeta;
  profile: ForgeProfileSummary;
  rows: ForgeAnalysisRow[];
}

export interface ForgeTabDefinition {
  description: string;
  disclaimer: string;
  id: "highest-profit" | "raw-crafts" | "ah-materials";
  include: (row: ForgeAnalysisRow) => boolean;
  label: string;
  sort: (left: ForgeAnalysisRow, right: ForgeAnalysisRow) => number;
}
