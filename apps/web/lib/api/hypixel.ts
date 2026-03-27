const HYPIXEL_BASE_URL = "https://api.hypixel.net";

function getApiKey(): string {
  const key = process.env.HYPIXEL_API_KEY;
  if (!key) {
    throw new Error("Missing HYPIXEL_API_KEY environment variable.");
  }
  return key;
}

async function hypixelFetch<T>(
  path: string,
  options?: RequestInit & { cacheMode?: "no-store" | "revalidate" }
): Promise<T> {
  const { cacheMode = "revalidate", ...init } = options ?? {};
  const response = await fetch(`${HYPIXEL_BASE_URL}${path}`, {
    ...init,
    headers: {
      "API-Key": getApiKey(),
      ...(init?.headers ?? {}),
    },
    ...(cacheMode === "revalidate"
      ? { next: { revalidate: 60 as const } }
      : { cache: "no-store" as const }),
  });

  if (!response.ok) {
    throw new Error(`Hypixel request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as {
    success?: boolean;
    cause?: string;
  };
  if (payload.success === false) {
    throw new Error(payload.cause || "Hypixel request failed.");
  }

  return payload as T;
}

export function getSkyBlockProfiles(uuid: string) {
  return hypixelFetch<{
    success: boolean;
    profiles: Record<string, unknown>[] | null;
  }>(`/v2/skyblock/profiles?uuid=${encodeURIComponent(uuid)}`, {
    cacheMode: "no-store",
  });
}

export function getSkyBlockBazaar() {
  return hypixelFetch<{
    success: boolean;
    lastUpdated: number;
    products: Record<
      string,
      {
        product_id: string;
        buy_summary?: Array<{
          amount: number;
          pricePerUnit: number;
          orders: number;
        }>;
        sell_summary?: Array<{
          amount: number;
          pricePerUnit: number;
          orders: number;
        }>;
        quick_status?: {
          productId: string;
          sellPrice: number;
          buyPrice: number;
        };
      }
    >;
  }>("/v2/skyblock/bazaar", { cacheMode: "no-store" });
}

export function getSkyBlockAuctions(page: number) {
  return hypixelFetch<{
    success: boolean;
    page: number;
    totalPages: number;
    totalAuctions: number;
    lastUpdated: number;
    auctions: Record<string, unknown>[];
  }>(`/v2/skyblock/auctions?page=${page}`, { cacheMode: "no-store" });
}

export function getSkyBlockItems() {
  return hypixelFetch<{
    success: boolean;
    lastUpdated: number;
    items: Array<{ id: string; name: string }>;
  }>("/v2/resources/skyblock/items", { cacheMode: "no-store" });
}
