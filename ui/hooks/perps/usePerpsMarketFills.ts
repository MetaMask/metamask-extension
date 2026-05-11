import { useEffect, useMemo, useState } from 'react';
import type { OrderFill } from '@metamask/perps-controller';
import {
  clearPerpsMarketFillsModuleCache,
  fetchFillsForCacheKey,
  peekWarmFills,
} from '../../providers/perps/perps-cache';
import { usePerpsLiveFills } from './stream';
import { usePerpsCacheKey } from './usePerpsCacheKey';

export { clearPerpsMarketFillsModuleCache };

type UsePerpsMarketFillsParams = {
  symbol: string;
  throttleMs?: number;
};

type UsePerpsMarketFillsReturn = {
  fills: OrderFill[];
  isInitialLoading: boolean;
};

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
  const fillsCacheKey = usePerpsCacheKey();

  const { fills: liveFills, isInitialLoading: wsLoading } = usePerpsLiveFills({
    throttleMs,
  });

  const [restFills, setRestFills] = useState<OrderFill[]>(
    () => peekWarmFills(fillsCacheKey) ?? [],
  );
  const [isRestLoading, setIsRestLoading] = useState(
    () => peekWarmFills(fillsCacheKey) === undefined,
  );

  // Tracks the scope for which we have confirmed REST fills. Starts equal to
  // fillsCacheKey so initial live fills (before REST resolves) are always
  // shown. When the env changes (testnet toggle, provider switch), this lags
  // behind fillsCacheKey, suppressing stale-env live fills until REST confirms
  // we're on the new scope.
  const [currentScopeKey, setCurrentScopeKey] = useState(fillsCacheKey);

  useEffect(() => {
    const cached = peekWarmFills(fillsCacheKey);
    if (cached !== undefined) {
      setRestFills(cached);
      setCurrentScopeKey(fillsCacheKey);
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
          setCurrentScopeKey(fillsCacheKey);
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

    // Exclude live fills while the scope is transitioning (e.g. testnet/provider
    // change with same address) to avoid merging fills from two environments.
    const effectiveLiveFills =
      currentScopeKey === fillsCacheKey ? liveFills : [];

    for (const fill of effectiveLiveFills) {
      if (fill.symbol === symbol) {
        const key = `${fill.orderId}-${fill.timestamp}-${fill.size}-${fill.price}`;
        fillsMap.set(key, fill);
      }
    }

    return Array.from(fillsMap.values()).sort(
      (a, b) => b.timestamp - a.timestamp,
    );
  }, [restFills, liveFills, currentScopeKey, fillsCacheKey, symbol]);

  const isInitialLoading = isRestLoading;

  return {
    fills,
    isInitialLoading,
  };
}
