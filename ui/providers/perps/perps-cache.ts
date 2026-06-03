import type { MarketInfo, OrderFill } from '@metamask/perps-controller';
import { PERPS_CONSTANTS } from '../../components/app/perps/constants';
import { submitRequestToBackground } from '../../store/background-connection';

// ---------------------------------------------------------------------------
// Shared cache key builder
// ---------------------------------------------------------------------------

/**
 * Builds the cache key used by both MarketInfo and OrderFills caches.
 * Centralised here so every consumer derives keys in the same format;
 * adding a new scope dimension only requires a change in one place.
 * @param activeProvider
 * @param isTestnet
 * @param address
 * @returns string
 */
export function buildPerpsCacheKey(
  activeProvider: string,
  isTestnet: boolean,
  address: string | undefined,
): string {
  const net = isTestnet ? 'testnet' : 'mainnet';
  const addressKey = (address ?? '').toLowerCase();
  return `${activeProvider}:${net}:${addressKey}`;
}

// ---------------------------------------------------------------------------
// MarketInfo cache (perpsGetMarkets)
// ---------------------------------------------------------------------------

const MARKET_INFO_CACHE_TTL_MS = 5 * 60_000; // 5 minutes

type MarketInfoCacheEntry = {
  cached: MarketInfo[] | null;
  fetchedAt: number;
  inflight: Promise<MarketInfo[]> | null;
};

const marketInfoCacheByKey = new Map<string, MarketInfoCacheEntry>();

function getMarketInfoCacheEntry(cacheKey: string): MarketInfoCacheEntry {
  let entry = marketInfoCacheByKey.get(cacheKey);
  if (!entry) {
    entry = { cached: null, fetchedAt: 0, inflight: null };
    marketInfoCacheByKey.set(cacheKey, entry);
  }
  return entry;
}

function isMarketInfoCacheWarm(entry: MarketInfoCacheEntry): boolean {
  return (
    entry.cached !== null &&
    Date.now() - entry.fetchedAt < MARKET_INFO_CACHE_TTL_MS
  );
}

export function peekCachedMarketInfos(
  cacheKey: string,
): MarketInfo[] | undefined {
  const entry = marketInfoCacheByKey.get(cacheKey);
  if (entry && isMarketInfoCacheWarm(entry)) {
    return entry.cached ?? undefined;
  }
  return undefined;
}

export function fetchMarketInfos(cacheKey: string): Promise<MarketInfo[]> {
  const entry = getMarketInfoCacheEntry(cacheKey);
  if (isMarketInfoCacheWarm(entry)) {
    return Promise.resolve(entry.cached as MarketInfo[]);
  }
  if (!entry.inflight) {
    entry.inflight = submitRequestToBackground<MarketInfo[]>(
      'perpsGetMarkets',
      [{}],
    )
      .then((infos) => {
        const validated = Array.isArray(infos) ? infos : [];
        entry.cached = validated;
        entry.fetchedAt = Date.now();
        entry.inflight = null;
        return validated;
      })
      .catch(() => {
        entry.inflight = null;
        return [] as MarketInfo[];
      });
  }
  return entry.inflight;
}

/**
 * Clears all module-level `MarketInfo` cache entries and drops in-flight
 * requests (callers hold their own `MarketInfoCacheEntry` references; stale
 * resolves write only to orphaned entries). Invoked when the Perps stream
 * layer resets (account switch, `clearAllCaches`, etc.) so UI never reads
 * cross-account or cross-session stale metadata.
 */
export function clearPerpsMarketInfoModuleCache(): void {
  marketInfoCacheByKey.clear();
}

// ---------------------------------------------------------------------------
// Order fills cache (perpsGetOrderFills)
// ---------------------------------------------------------------------------

const FILLS_CACHE_TTL_MS = 30_000;

type FillsCacheEntry = {
  cached: OrderFill[] | null;
  fetchedAt: number;
  inflight: Promise<OrderFill[]> | null;
};

const fillsCacheByKey = new Map<string, FillsCacheEntry>();

function getFillsCacheEntry(cacheKey: string): FillsCacheEntry {
  let entry = fillsCacheByKey.get(cacheKey);
  if (!entry) {
    entry = { cached: null, fetchedAt: 0, inflight: null };
    fillsCacheByKey.set(cacheKey, entry);
  }
  return entry;
}

export function peekWarmFills(cacheKey: string): OrderFill[] | undefined {
  const entry = fillsCacheByKey.get(cacheKey);
  if (
    entry &&
    entry.cached !== null &&
    Date.now() - entry.fetchedAt < FILLS_CACHE_TTL_MS
  ) {
    return entry.cached;
  }
  return undefined;
}

/**
 * Ensures REST fills for `cacheKey` are loading or loaded, writing to module
 * cache on completion regardless of component mount state (same idea as
 * `fetchMarketInfos`).
 * @param cacheKey
 * @returns Promise<OrderFill[]>
 */
export function fetchFillsForCacheKey(cacheKey: string): Promise<OrderFill[]> {
  const warm = peekWarmFills(cacheKey);
  if (warm !== undefined) {
    return Promise.resolve(warm);
  }

  const entry = getFillsCacheEntry(cacheKey);
  if (!entry.inflight) {
    const startTime = Date.now() - PERPS_CONSTANTS.FILLS_LOOKBACK_MS;
    entry.inflight = submitRequestToBackground<OrderFill[]>(
      'perpsGetOrderFills',
      [{ aggregateByTime: false, startTime }],
    )
      .then((result) => {
        const fills = Array.isArray(result) ? result : [];
        entry.cached = fills;
        entry.fetchedAt = Date.now();
        entry.inflight = null;
        return fills;
      })
      .catch(() => {
        entry.inflight = null;
        return [] as OrderFill[];
      });
  }
  return entry.inflight;
}

/**
 * Clears the module-level REST fills cache. Invoked when the Perps stream
 * layer resets so UI never reads cross-account or cross-environment stale
 * fills.
 */
export function clearPerpsMarketFillsModuleCache(): void {
  fillsCacheByKey.clear();
}
