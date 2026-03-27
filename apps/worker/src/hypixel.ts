const HYPIXEL_BASE_URL = "https://api.hypixel.net";

function getApiKey(): string {
  const key = process.env.HYPIXEL_API_KEY;
  if (!key) {
    throw new Error("Missing HYPIXEL_API_KEY environment variable.");
  }
  return key;
}

async function hypixelFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${HYPIXEL_BASE_URL}${path}`, {
    headers: {
      "API-Key": getApiKey(),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Hypixel request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as {
    cause?: string;
    success?: boolean;
  };
  if (payload.success === false) {
    throw new Error(payload.cause || "Hypixel request failed.");
  }

  return payload as T;
}

export function getSkyBlockBazaar() {
  return hypixelFetch<{
    lastUpdated: number;
    products: Record<
      string,
      {
        buy_summary?: Array<{
          amount: number;
          orders: number;
          pricePerUnit: number;
        }>;
        quick_status?: {
          buyPrice: number;
          productId: string;
          sellPrice: number;
        };
        sell_summary?: Array<{
          amount: number;
          orders: number;
          pricePerUnit: number;
        }>;
      }
    >;
    success: boolean;
  }>("/v2/skyblock/bazaar");
}

export function getSkyBlockAuctions(page: number) {
  return hypixelFetch<{
    auctions: Record<string, unknown>[];
    lastUpdated: number;
    page: number;
    success: boolean;
    totalAuctions: number;
    totalPages: number;
  }>(`/v2/skyblock/auctions?page=${page}`);
}

export function getSkyBlockItems() {
  return hypixelFetch<{
    items: Array<{ id: string; name: string }>;
    lastUpdated: number;
    success: boolean;
  }>("/v2/resources/skyblock/items");
}
