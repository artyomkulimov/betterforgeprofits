export interface PriceSnapshotRecord {
  fetchedAt: number;
  hypixelLastUpdated: number | null;
  id: number;
  isCurrent: boolean;
  source: "auction" | "bazaar";
}
