import { badRequest, rateLimited } from "@/lib/server-errors";

const MOJANG_USERNAME_PATTERN = /^[A-Za-z0-9_]{1,16}$/;

export interface RateLimitDecision {
  key: string;
  limit: number;
  remaining: number;
  resetAt: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface CacheEntry<T> {
  expiresAt: number;
  value: Promise<T>;
}

export interface ServerSecurityOptions {
  limit: number;
  namespace: string;
  windowMs: number;
}

const globalSecurity = globalThis as typeof globalThis & {
  __frogeCache?: Map<string, CacheEntry<unknown>>;
  __frogeRateLimit?: Map<string, RateLimitEntry>;
};

function getCacheStore() {
  if (!globalSecurity.__frogeCache) {
    globalSecurity.__frogeCache = new Map();
  }

  return globalSecurity.__frogeCache;
}

function getRateLimitStore() {
  if (!globalSecurity.__frogeRateLimit) {
    globalSecurity.__frogeRateLimit = new Map();
  }

  return globalSecurity.__frogeRateLimit;
}

function cleanupExpiredRateLimitEntries(now: number) {
  const store = getRateLimitStore();

  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstValue = forwardedFor.split(",")[0]?.trim();
    if (firstValue) {
      return firstValue;
    }
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp;
  }

  return "unknown";
}

export function applyRateLimit(
  request: Request,
  options: ServerSecurityOptions
): RateLimitDecision {
  const store = getRateLimitStore();
  const now = Date.now();
  const clientIp = getClientIp(request);
  const key = `${options.namespace}:${clientIp}`;
  cleanupExpiredRateLimitEntries(now);

  const existing = store.get(key);
  const entry =
    existing && existing.resetAt > now
      ? existing
      : {
          count: 0,
          resetAt: now + options.windowMs,
        };

  entry.count += 1;
  store.set(key, entry);

  if (entry.count > options.limit) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((entry.resetAt - now) / 1000)
    );
    throw rateLimited(
      "Too many requests. Please try again shortly.",
      retryAfterSeconds
    );
  }

  return {
    key,
    limit: options.limit,
    remaining: Math.max(0, options.limit - entry.count),
    resetAt: entry.resetAt,
  };
}

export function getRateLimitHeaders(decision: RateLimitDecision): HeadersInit {
  return {
    "RateLimit-Limit": String(decision.limit),
    "RateLimit-Remaining": String(decision.remaining),
    "RateLimit-Reset": String(Math.ceil(decision.resetAt / 1000)),
    Vary: "x-forwarded-for, x-real-ip",
  };
}

export async function getCached<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>
): Promise<T> {
  const store = getCacheStore();
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

export function normalizeUsername(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

export function validateMinecraftUsername(value: string): string {
  const username = value.trim();

  if (!username) {
    throw badRequest("Username is required.");
  }

  if (!MOJANG_USERNAME_PATTERN.test(username)) {
    throw badRequest(
      "Username must be 1-16 characters and contain only letters, numbers, and underscores."
    );
  }

  return username;
}

export function parseBoundedInteger(
  value: string | null,
  field: string,
  bounds: { max: number; min: number }
): number | null {
  if (value === null || value.trim() === "") {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    throw badRequest(`${field} must be an integer.`);
  }

  if (parsed < bounds.min || parsed > bounds.max) {
    throw badRequest(
      `${field} must be between ${bounds.min} and ${bounds.max}.`
    );
  }

  return parsed;
}
