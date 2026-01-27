/**
 * RPC Request Cache for deduplicating identical requests during initialization.
 *
 * This cache helps prevent N+1 API call issues by ensuring that multiple
 * identical RPC requests (same method and params) share a single network call.
 *
 * The cache is particularly useful during app initialization when multiple
 * wallet snaps may independently query the same RPC endpoints (e.g., eth_accounts,
 * eth_chainId) for the same network.
 */

type CacheKey = string;
type CacheEntry<Result> = {
  promise: Promise<Result>;
  timestamp: number;
};

export class RpcRequestCache {
  #cache: Map<CacheKey, CacheEntry<unknown>>;

  #enabled: boolean;

  readonly #ttlMs: number;

  /**
   * Creates a new RPC request cache.
   *
   * @param options - Configuration options
   * @param options.ttlMs - Time-to-live for cached entries in milliseconds (default: 30000)
   */
  constructor({ ttlMs = 30000 }: { ttlMs?: number } = {}) {
    this.#cache = new Map();
    this.#enabled = false;
    this.#ttlMs = ttlMs;
  }

  /**
   * Enables the cache. While enabled, requests will be deduplicated.
   */
  enable(): void {
    this.#enabled = true;
  }

  /**
   * Disables the cache and clears all cached entries.
   */
  disable(): void {
    this.#enabled = false;
    this.clear();
  }

  /**
   * Checks if the cache is currently enabled.
   *
   * @returns True if the cache is enabled
   */
  isEnabled(): boolean {
    return this.#enabled;
  }

  /**
   * Clears all cached entries.
   */
  clear(): void {
    this.#cache.clear();
  }

  /**
   * Generates a cache key from RPC request parameters.
   *
   * @param networkClientId - Network client identifier
   * @param method - RPC method name
   * @param params - RPC method parameters
   * @returns A string key for caching
   */
  #getCacheKey(
    networkClientId: string | undefined,
    method: string,
    params: unknown[],
  ): CacheKey {
    // Create a deterministic key from the request parameters
    const paramsKey = JSON.stringify(params);
    return `${networkClientId || 'default'}:${method}:${paramsKey}`;
  }

  /**
   * Checks if a cached entry has expired.
   *
   * @param entry - Cache entry to check
   * @returns True if the entry has expired
   */
  #isExpired(entry: CacheEntry<unknown>): boolean {
    return Date.now() - entry.timestamp > this.#ttlMs;
  }

  /**
   * Wraps an RPC request with caching logic.
   *
   * If the cache is disabled, the request is executed immediately without caching.
   * If the cache is enabled and contains a valid entry for this request, the cached
   * promise is returned. Otherwise, the request is executed and the result is cached.
   *
   * @param networkClientId - Network client identifier
   * @param method - RPC method name
   * @param params - RPC method parameters
   * @param executor - Function that executes the actual RPC request
   * @returns Promise resolving to the RPC response
   */
  async wrap<Result>(
    networkClientId: string | undefined,
    method: string,
    params: unknown[],
    executor: () => Promise<Result>,
  ): Promise<Result> {
    // If cache is disabled, execute request directly
    if (!this.#enabled) {
      return executor();
    }

    const cacheKey = this.#getCacheKey(networkClientId, method, params);
    const cachedEntry = this.#cache.get(cacheKey) as
      | CacheEntry<Result>
      | undefined;

    // Return cached promise if it exists and hasn't expired
    if (cachedEntry && !this.#isExpired(cachedEntry)) {
      return cachedEntry.promise;
    }

    // Execute the request and cache the promise
    const promise = executor();
    this.#cache.set(cacheKey, {
      promise,
      timestamp: Date.now(),
    });

    // Clean up the cache entry after the promise resolves or rejects
    // This prevents the cache from growing indefinitely
    promise
      .then(() => {
        // Keep the result cached for the TTL duration
        setTimeout(() => {
          const entry = this.#cache.get(cacheKey);
          if (entry && entry.promise === promise) {
            this.#cache.delete(cacheKey);
          }
        }, this.#ttlMs);
      })
      .catch(() => {
        // Remove failed requests immediately to allow retries
        const entry = this.#cache.get(cacheKey);
        if (entry && entry.promise === promise) {
          this.#cache.delete(cacheKey);
        }
      });

    return promise;
  }

  /**
   * Gets the current size of the cache.
   *
   * @returns Number of entries in the cache
   */
  size(): number {
    return this.#cache.size;
  }
}

// Global singleton instance for use across the application
export const globalRpcRequestCache = new RpcRequestCache();
