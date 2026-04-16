import type {
  MarketInfo,
  OrderFill,
  UserHistoryItem,
} from '@metamask/perps-controller';
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
        return entry.cached ?? ([] as MarketInfo[]);
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
        return entry.cached ?? ([] as OrderFill[]);
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

// ---------------------------------------------------------------------------
// User history cache (perpsGetUserHistory)
// ---------------------------------------------------------------------------

const USER_HISTORY_CACHE_TTL_MS = 30_000; // 30 seconds

type UserHistoryCacheEntry = {
  cached: UserHistoryItem[] | null;
  fetchedAt: number;
  inflight: Promise<UserHistoryItem[]> | null;
};

const userHistoryCacheByKey = new Map<string, UserHistoryCacheEntry>();

/**
 * Builds a cache key that captures the exact request inputs so that
 * different (startTime, endTime, accountId) tuples get independent
 * cache entries. This prevents one caller's parameterless fetch from
 * serving stale data to a caller that needs a specific time window.
 *
 * @param startTime - start of the requested window (ms epoch)
 * @param endTime - end of the requested window (ms epoch)
 * @param accountId - CAIP account identifier
 * @returns stable string key
 */
function buildUserHistoryCacheKey(
  startTime?: number,
  endTime?: number,
  accountId?: string,
): string {
  return `${accountId ?? 'default'}:${startTime ?? 0}:${endTime ?? 0}`;
}

function getUserHistoryCacheEntry(key: string): UserHistoryCacheEntry {
  let entry = userHistoryCacheByKey.get(key);
  if (!entry) {
    entry = { cached: null, fetchedAt: 0, inflight: null };
    userHistoryCacheByKey.set(key, entry);
  }
  return entry;
}

/**
 * Returns a warm cache hit for the given request inputs, or `undefined`
 * if the entry is missing / expired.
 *
 * @param startTime - start of the requested window (ms epoch)
 * @param endTime - end of the requested window (ms epoch)
 * @param accountId - CAIP account identifier
 * @returns cached items or undefined
 */
export function peekCachedUserHistory(
  startTime?: number,
  endTime?: number,
  accountId?: string,
): UserHistoryItem[] | undefined {
  const key = buildUserHistoryCacheKey(startTime, endTime, accountId);
  const entry = userHistoryCacheByKey.get(key);
  if (
    entry &&
    entry.cached !== null &&
    Date.now() - entry.fetchedAt < USER_HISTORY_CACHE_TTL_MS
  ) {
    return entry.cached;
  }
  return undefined;
}

/**
 * Fetches user history for the given request inputs, deduplicating
 * concurrent calls with the same params through a shared inflight promise.
 * Results are cached per (startTime, endTime, accountId) tuple.
 *
 * @param startTime - start of the requested window (ms epoch)
 * @param endTime - end of the requested window (ms epoch)
 * @param accountId - CAIP account identifier
 * @returns resolved user history items
 */
export function fetchUserHistory(
  startTime?: number,
  endTime?: number,
  accountId?: string,
): Promise<UserHistoryItem[]> {
  const key = buildUserHistoryCacheKey(startTime, endTime, accountId);
  const warm = peekCachedUserHistory(startTime, endTime, accountId);
  if (warm !== undefined) {
    return Promise.resolve(warm);
  }

  const entry = getUserHistoryCacheEntry(key);
  if (!entry.inflight) {
    entry.inflight = submitRequestToBackground<UserHistoryItem[]>(
      'perpsGetUserHistory',
      [{ startTime, endTime, accountId }],
    )
      .then((result) => {
        const items = Array.isArray(result) ? result : [];
        entry.cached = items;
        entry.fetchedAt = Date.now();
        entry.inflight = null;
        return items;
      })
      .catch(() => {
        entry.inflight = null;
        return entry.cached ?? ([] as UserHistoryItem[]);
      });
  }
  return entry.inflight;
}

/**
 * Clears the module-level user history cache. Invoked on account switch,
 * network change, or full reset so UI never reads cross-account stale
 * deposit/withdrawal data.
 */
export function clearUserHistoryModuleCache(): void {
  userHistoryCacheByKey.clear();
}
