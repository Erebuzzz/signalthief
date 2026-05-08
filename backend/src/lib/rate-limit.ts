import { ApiError } from './errors.js';

interface RateLimitStore {
  timestamps: number[];
}

export class InMemoryRateLimiter {
  private store = new Map<string, RateLimitStore>();

  constructor(
    private maxRequests: number = 30,
    private windowMs: number = 60000, // 1 minute
  ) {}

  /** Returns true if request is allowed, throws ApiError if rate limited */
  assert(key: string): void {
    const now = Date.now();
    let entry = this.store.get(key);

    if (!entry) {
      entry = { timestamps: [] };
      this.store.set(key, entry);
    }

    // Prune expired timestamps
    const cutoff = now - this.windowMs;
    entry.timestamps = entry.timestamps.filter(ts => ts > cutoff);

    if (entry.timestamps.length >= this.maxRequests) {
      const retryAfter = Math.ceil((entry.timestamps[0] - cutoff) / 1000);
      throw new ApiError(429, `Rate limit exceeded. Retry in ${retryAfter}s`);
    }

    entry.timestamps.push(now);
  }

  /** Periodic cleanup of stale entries */
  startCleanup(intervalMs: number = 300000): NodeJS.Timeout {
    return setInterval(() => {
      const now = Date.now();
      const cutoff = now - this.windowMs;
      for (const [key, entry] of this.store) {
        entry.timestamps = entry.timestamps.filter(ts => ts > cutoff);
        if (entry.timestamps.length === 0) {
          this.store.delete(key);
        }
      }
    }, intervalMs);
  }
}

export const rateLimiter = new InMemoryRateLimiter(30, 60000);