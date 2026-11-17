import type { Hex, Json } from '@metamask/utils';

export type SessionCapabilities = Record<Hex, Record<string, Json>>;

type CacheEntry = {
  value?: SessionCapabilities;
  timestamp: number;
  pending?: Promise<SessionCapabilities>;
};

type CreateSessionCapabilitiesOptions = {
  /**
   * Computes the capabilities for an address. `chainIds` of `undefined` means
   * all configured chains.
   */
  computeCapabilities: (
    address: Hex,
    chainIds?: Hex[],
  ) => Promise<SessionCapabilities>;
  /** How long a cached value is served before it is refreshed. */
  freshMs?: number;
  /** How long a caller waits for a value that is not cached yet. */
  timeoutMs?: number;
  now?: () => number;
};

export const SESSION_CAPABILITIES_FRESH_MS = 5 * 60 * 1000;
export const SESSION_CAPABILITIES_TIMEOUT_MS = 2000;

/**
 * Builds a provider for the capabilities that hydrate
 * `sessionProperties.eip155Capabilities`.
 *
 * Computing capabilities fans out one RPC call per chain, which is too slow
 * for the short session restore timeouts of Multichain API clients. Results
 * are cached with stale while revalidate semantics and in flight
 * deduplication, so only the caller that starts the first computation for an
 * account and chain set waits, and that wait is bounded by `timeoutMs`.
 * Concurrent callers are rejected right away, and a computation that outlives
 * the timeout keeps running and warms the cache for later calls.
 *
 * Cached values can lag behind wallet state (preferences, network
 * configuration, account delegation) by up to `freshMs`. That is acceptable
 * because the field is a hint for dapp side caches, while a direct
 * `wallet_getCapabilities` request stays authoritative.
 *
 * @param options - The options.
 * @param options.computeCapabilities - Computes uncached capabilities.
 * @param options.freshMs - How long a cached value is served before it is
 * refreshed in the background.
 * @param options.timeoutMs - How long a caller waits for an uncached value.
 * @param options.now - Returns the current time in milliseconds.
 * @returns An object with `getSessionCapabilities` and `clear`.
 */
export function createSessionCapabilities({
  computeCapabilities,
  freshMs = SESSION_CAPABILITIES_FRESH_MS,
  timeoutMs = SESSION_CAPABILITIES_TIMEOUT_MS,
  now = Date.now,
}: CreateSessionCapabilitiesOptions) {
  const cache = new Map<string, CacheEntry>();

  const buildKey = (address: string, chainIds?: Hex[]): string => {
    const chainsKey = chainIds?.length
      ? chainIds
          .map((chainId) => chainId.toLowerCase())
          .sort((a, b) => a.localeCompare(b))
          .join(',')
      : '*';
    return `${address.toLowerCase()}:${chainsKey}`;
  };

  // Failures are never cached and never evict a servable value.
  const computeAndCache = async (
    key: string,
    address: string,
    chainIds?: Hex[],
  ): Promise<SessionCapabilities> => {
    try {
      const value = await computeCapabilities(address as Hex, chainIds);
      cache.set(key, { value, timestamp: now() });
      return value;
    } catch (error) {
      const entry = cache.get(key);
      if (entry?.value) {
        entry.pending = undefined;
      } else {
        cache.delete(key);
      }
      throw error;
    }
  };

  const withTimeout = (
    promise: Promise<SessionCapabilities>,
  ): Promise<SessionCapabilities> =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error('Timed out computing session capabilities')),
        timeoutMs,
      );
      promise.then(
        (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        (error) => {
          clearTimeout(timer);
          reject(error);
        },
      );
    });

  /**
   * Gets the capabilities for the given address.
   *
   * @param address - The EVM address.
   * @param chainIds - The chains to compute capabilities for. `undefined` means
   * all configured chains, while an empty array means no chains and resolves
   * to no capabilities.
   * @returns The capabilities keyed by chain ID.
   */
  const getSessionCapabilities = (
    address: string,
    chainIds?: Hex[],
  ): Promise<SessionCapabilities> => {
    if (chainIds && chainIds.length === 0) {
      return Promise.resolve({});
    }

    const key = buildKey(address, chainIds);
    const entry = cache.get(key);

    if (entry?.value) {
      if (now() - entry.timestamp >= freshMs && !entry.pending) {
        entry.pending = computeAndCache(key, address, chainIds);
        entry.pending.catch(() => undefined);
      }
      return Promise.resolve(entry.value);
    }

    // Only the caller that starts the first computation waits for it, so
    // concurrent calls do not each add the timeout to their latency.
    if (entry?.pending) {
      return Promise.reject(
        new Error('Session capabilities are still being computed'),
      );
    }

    const pending = computeAndCache(key, address, chainIds);
    cache.set(key, { timestamp: 0, pending });
    return withTimeout(pending);
  };

  return {
    getSessionCapabilities,
    clear: () => cache.clear(),
  };
}
