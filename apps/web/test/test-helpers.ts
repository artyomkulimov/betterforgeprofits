export function resetTestState() {
  (
    globalThis as typeof globalThis & {
      __frogeCache?: Map<string, unknown>;
      __frogePricingSnapshot?: unknown;
      __frogeRateLimit?: Map<string, unknown>;
    }
  ).__frogeCache = undefined;
  (
    globalThis as typeof globalThis & {
      __frogeCache?: Map<string, unknown>;
      __frogePricingSnapshot?: unknown;
      __frogeRateLimit?: Map<string, unknown>;
    }
  ).__frogeRateLimit = undefined;
  (
    globalThis as typeof globalThis & {
      __frogeCache?: Map<string, unknown>;
      __frogePricingSnapshot?: unknown;
      __frogeRateLimit?: Map<string, unknown>;
    }
  ).__frogePricingSnapshot = undefined;
}

export async function readJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}
