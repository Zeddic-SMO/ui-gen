export const RATE_LIMITS = {
  anonymous: 2,
  authenticated: 5,
} as const;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
}

// Use globalThis singleton pattern for hot-reload persistence
const globalForRateLimit = globalThis as unknown as {
  rateLimitStore: Map<string, number> | undefined;
};

const getRateLimitStore = (): Map<string, number> => {
  if (!globalForRateLimit.rateLimitStore) {
    globalForRateLimit.rateLimitStore = new Map<string, number>();
  }
  return globalForRateLimit.rateLimitStore;
};

/**
 * Check and consume a rate limit token for the given identifier.
 * Returns whether the request is allowed and remaining quota.
 * Does not increment count if already at or above limit.
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number
): RateLimitResult {
  const store = getRateLimitStore();
  const currentCount = store.get(identifier) ?? 0;

  if (currentCount >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      limit: maxRequests,
    };
  }

  // Consume a token
  store.set(identifier, currentCount + 1);

  return {
    allowed: true,
    remaining: maxRequests - currentCount - 1,
    limit: maxRequests,
  };
}

/**
 * Get current usage count for an identifier (for testing/debugging).
 */
export function getUsageCount(identifier: string): number {
  const store = getRateLimitStore();
  return store.get(identifier) ?? 0;
}

/**
 * Reset rate limit for an identifier (for testing).
 */
export function resetRateLimit(identifier: string): void {
  const store = getRateLimitStore();
  store.delete(identifier);
}

/**
 * Clear all rate limits (for testing).
 */
export function clearAllRateLimits(): void {
  const store = getRateLimitStore();
  store.clear();
}
