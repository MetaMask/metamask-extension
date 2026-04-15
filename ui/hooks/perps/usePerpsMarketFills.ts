import { useEffect, useMemo, useState } from 'react';
import type { OrderFill } from '@metamask/perps-controller';
import { useSelector } from 'react-redux';
import { PERPS_CONSTANTS } from '../../components/app/perps/constants';
import { getSelectedInternalAccount } from '../../selectors/accounts';
import {
  selectPerpsActiveProvider,
  selectPerpsIsTestnet,
} from '../../selectors/perps-controller';
import { submitRequestToBackground } from '../../store/background-connection';
import { usePerpsLiveFills } from './stream';

type UsePerpsMarketFillsParams = {
  symbol: string;
  throttleMs?: number;
};

type UsePerpsMarketFillsReturn = {
  fills: OrderFill[];
  isInitialLoading: boolean;
};

/** Cache TTL: re-use fills REST result for 30 seconds across re-navigations */
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

function peekWarmFills(cacheKey: string): OrderFill[] | undefined {
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
 * Ensures REST fills for `cacheKey` are loading or loaded; updates module cache
 * when the request completes even if no component is still mounted (same idea
 * as `fetchMarketInfos` in usePerpsMarketInfo).
 */
function fetchFillsForCacheKey(cacheKey: string): Promise<OrderFill[]> {
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
 * fills (mirrors `clearPerpsMarketInfoModuleCache` in usePerpsMarketInfo).
 */
export function clearPerpsMarketFillsModuleCache(): void {
  fillsCacheByKey.clear();
}

/**
 * Hook for fetching market-specific fills with combined WebSocket + REST data.
 *
 * Combines two data sources:
 * 1. WebSocket (via usePerpsLiveFills) - Real-time updates, limited to recent fills
 * 2. REST API (via perpsGetOrderFills) - Historical fills from last 3 months
 *
 * WebSocket data displays immediately for instant feedback.
 * REST data loads in background and merges silently for complete history.
 * Live fills take precedence over REST fills (fresher data).
 *
 * @param params - Configuration options including symbol filter
 * @param params.symbol - Market symbol to filter fills for (e.g., "BTC", "ETH")
 * @param params.throttleMs - Throttle interval for WebSocket updates in ms (default: 0)
 * @returns Object containing fills array and loading state
 */
export function usePerpsMarketFills({
  symbol,
  throttleMs = 0,
}: UsePerpsMarketFillsParams): UsePerpsMarketFillsReturn {
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const selectedAddress = selectedAccount?.address;
  const activeProvider = useSelector(selectPerpsActiveProvider);
  const isTestnet = useSelector(selectPerpsIsTestnet);

  const fillsCacheKey = useMemo(() => {
    const net = isTestnet ? 'testnet' : 'mainnet';
    const addressKey = (selectedAddress ?? '').toLowerCase();
    return `${activeProvider}:${net}:${addressKey}`;
  }, [activeProvider, isTestnet, selectedAddress]);

  const { fills: liveFills, isInitialLoading: wsLoading } = usePerpsLiveFills({
    throttleMs,
  });

  const [restFills, setRestFills] = useState<OrderFill[]>(() =>
    peekWarmFills(fillsCacheKey) ?? [],
  );
  const [isRestLoading, setIsRestLoading] = useState(
    () => peekWarmFills(fillsCacheKey) === undefined,
  );

  useEffect(() => {
    const cached = peekWarmFills(fillsCacheKey);
    if (cached !== undefined) {
      setRestFills(cached);
      setIsRestLoading(false);
      return undefined;
    }

    let cancelled = false;
    setRestFills([]);
    setIsRestLoading(true);

    fetchFillsForCacheKey(fillsCacheKey)
      .then((result) => {
        if (!cancelled) {
          setRestFills(result);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsRestLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fillsCacheKey]);

  const fills = useMemo(() => {
    const fillsMap = new Map<string, OrderFill>();

    for (const fill of restFills) {
      if (fill.symbol === symbol) {
        const key = `${fill.orderId}-${fill.timestamp}-${fill.size}-${fill.price}`;
        fillsMap.set(key, fill);
      }
    }

    for (const fill of liveFills) {
      if (fill.symbol === symbol) {
        const key = `${fill.orderId}-${fill.timestamp}-${fill.size}-${fill.price}`;
        fillsMap.set(key, fill);
      }
    }

    return Array.from(fillsMap.values()).sort(
      (a, b) => b.timestamp - a.timestamp,
    );
  }, [restFills, liveFills, symbol]);

  const isInitialLoading = wsLoading || isRestLoading;

  return {
    fills,
    isInitialLoading,
  };
}
