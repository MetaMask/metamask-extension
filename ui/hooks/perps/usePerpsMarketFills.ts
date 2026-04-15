import { useCallback, useEffect, useMemo, useState } from 'react';
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

type FillsCache = {
  fills: OrderFill[];
  fetchedAt: number;
  cacheKey: string;
};

let fillsCache: FillsCache | null = null;

/**
 * Clears the module-level REST fills cache. Invoked when the Perps stream
 * layer resets so UI never reads cross-account or cross-environment stale
 * fills (mirrors `clearPerpsMarketInfoModuleCache` in usePerpsMarketInfo).
 */
export function clearPerpsMarketFillsModuleCache(): void {
  fillsCache = null;
}

/** @internal Alias for unit tests. */
export function _resetFillsCacheForTesting(): void {
  clearPerpsMarketFillsModuleCache();
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

  // Initialise from cache so re-navigation renders immediately without a spinner
  const isCacheHit = Boolean(
    fillsCache &&
      fillsCache.cacheKey === fillsCacheKey &&
      Date.now() - fillsCache.fetchedAt < FILLS_CACHE_TTL_MS,
  );

  const [restFills, setRestFills] = useState<OrderFill[]>(
    isCacheHit ? (fillsCache as FillsCache).fills : [],
  );
  const [isRestLoading, setIsRestLoading] = useState(!isCacheHit);

  const fetchRestFills = useCallback(async () => {
    const startTime = Date.now() - PERPS_CONSTANTS.FILLS_LOOKBACK_MS;
    const result = await submitRequestToBackground<OrderFill[]>(
      'perpsGetOrderFills',
      [{ aggregateByTime: false, startTime }],
    );
    return Array.isArray(result) ? result : [];
  }, []);

  useEffect(() => {
    // Skip fetch if the cache is still warm for this scope (provider, net, account).
    if (
      fillsCache &&
      fillsCache.cacheKey === fillsCacheKey &&
      Date.now() - fillsCache.fetchedAt < FILLS_CACHE_TTL_MS
    ) {
      setRestFills(fillsCache.fills);
      setIsRestLoading(false);
      return undefined;
    }

    let cancelled = false;
    setRestFills([]);
    setIsRestLoading(true);

    fetchRestFills()
      .then((result) => {
        if (!cancelled) {
          fillsCache = {
            fills: result,
            fetchedAt: Date.now(),
            cacheKey: fillsCacheKey,
          };
          setRestFills(result);
        }
      })
      .catch(() => {
        // REST fetch failed silently — WebSocket fills still work
      })
      .finally(() => {
        if (!cancelled) {
          setIsRestLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fetchRestFills, fillsCacheKey]);

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
