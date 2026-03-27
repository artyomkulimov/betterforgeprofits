interface CacheEntry<T> {
  expiresAt: number;
  value: Promise<T>;
}

const globalCache = globalThis as typeof globalThis & {
  __frogeCache?: Map<string, CacheEntry<unknown>>;
};

function getStore() {
  if (!globalCache.__frogeCache) {
    globalCache.__frogeCache = new Map();
  }

  return globalCache.__frogeCache;
}

export async function getCached<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>
): Promise<T> {
  const store = getStore();
  const now = Date.now();
  const existing = store.get(key) as CacheEntry<T> | undefined;

  if (existing && existing.expiresAt > now) {
    return existing.value;
  }

  const value = loader();
  store.set(key, {
    expiresAt: now + ttlMs,
    value,
  });

  try {
    return await value;
  } catch (error) {
    store.delete(key);
    throw error;
  }
}
