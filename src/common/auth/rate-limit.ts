import { LRUCache } from "lru-cache";

type RateLimitOptions = {
  uniqueTokenPerInterval?: number;
  interval?: number;
};

function rateLimit(options?: RateLimitOptions) {
  const tokenCache = new LRUCache<string, number[]>({
    max: options?.uniqueTokenPerInterval || 500,
    ttl: options?.interval || 60000,
  });

  return {
    check: (limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const tokenCount = tokenCache.get(token) || [0];
        if (tokenCount[0] === 0) {
          tokenCache.set(token, tokenCount);
        }
        tokenCount[0] += 1;

        const currentUsage = tokenCount[0];
        const isRateLimited = currentUsage > limit;

        if (isRateLimited) {
          reject(new Error("Rate limit exceeded"));
        } else {
          resolve();
        }
      }),
  };
}

export const actionRateLimit = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 500,
});

export const limiter = rateLimit({
  interval: 15 * 60 * 1000,
});

export function getClientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
}
