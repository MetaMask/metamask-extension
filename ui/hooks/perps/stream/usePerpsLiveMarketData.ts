import { useState, useEffect, useCallback, useRef } from 'react';
import { usePerpsStreamManager } from './usePerpsStreamManager';
import type { PerpsMarketData } from '@metamask/perps-controller';

/**
 * Options for usePerpsLiveMarketData hook
 */
export type UsePerpsLiveMarketDataOptions = {
  /**
   * Whether to auto-fetch on mount.
   *
   * @default true
   */
  autoSubscribe?: boolean;
};

/**
 * Return type for usePerpsLiveMarketData hook
 */
export type UsePerpsLiveMarketDataReturn = {
  /**
   * All market data
   */
  markets: PerpsMarketData[];

  /**
   * Crypto markets only (no marketSource)
   */
  cryptoMarkets: PerpsMarketData[];

  /**
   * HIP-3 markets only (has marketSource)
   */
  hip3Markets: PerpsMarketData[];

  /**
   * Whether the initial data is being loaded
   */
  isInitialLoading: boolean;

  /**
   * Error if fetch failed
   */
  error: Error | null;

  /**
   * Manually refresh market data
   */
  refresh: () => void;
};

// Stable empty array reference
const EMPTY_MARKETS: PerpsMarketData[] = [];

/**
 * Hook for fetching market data with prices.
 *
 * Uses the PerpsStreamManager for cached, BehaviorSubject-like access.
 * Cached data is delivered immediately on subscribe, eliminating loading
 * skeletons when navigating between Perps views.
 *
 * @param options - Hook options
 * @returns Market data and loading state
 * @example
 * ```tsx
 * const { cryptoMarkets, hip3Markets, isInitialLoading } = usePerpsLiveMarketData();
 *
 * if (isInitialLoading) {
 *   return <Loading />;
 * }
 *
 * return (
 *   <>
 *     <MarketList markets={cryptoMarkets} title="Crypto" />
 *     <MarketList markets={hip3Markets} title="Stocks & Commodities" />
 *   </>
 * );
 * ```
 */
export function usePerpsLiveMarketData(
  options: UsePerpsLiveMarketDataOptions = {},
): UsePerpsLiveMarketDataReturn {
  const { autoSubscribe = true } = options;
  const { streamManager, isInitializing } = usePerpsStreamManager();

  // Initialize state from cache if available (synchronous)
  const [markets, setMarkets] = useState<PerpsMarketData[]>(() => {
    if (streamManager) {
      return streamManager.markets.getCachedData();
    }
    return EMPTY_MARKETS;
  });

  const [error, setError] = useState<Error | null>(null);

  // Track whether we've received real data
  const hasReceivedData = useRef(false);
  const [isInitialLoading, setIsInitialLoading] = useState(() => {
    if (streamManager?.markets.hasCachedData()) {
      hasReceivedData.current = true;
      return false;
    }
    return true;
  });

  // Derive crypto and HIP-3 markets
  const cryptoMarkets = markets.filter((m) => !m.marketSource);
  const hip3Markets = markets.filter((m) => m.marketSource);

  // Manual refresh function
  const refresh = useCallback(() => {
    if (!streamManager) {
      return;
    }
    // Clear and re-subscribe to trigger a fresh fetch
    streamManager.markets.clearCache();
    hasReceivedData.current = false;
    setIsInitialLoading(true);
  }, [streamManager]);

  useEffect(() => {
    // If still initializing stream manager, stay in loading state
    if (isInitializing || !streamManager) {
      return;
    }

    if (!autoSubscribe) {
      setIsInitialLoading(false);
      return;
    }

    // Check if we have cached data immediately
    if (streamManager.markets.hasCachedData()) {
      const cached = streamManager.markets.getCachedData();
      setMarkets(cached);
      if (!hasReceivedData.current) {
        hasReceivedData.current = true;
        setIsInitialLoading(false);
      }
    }

    // Subscribe - callback fires immediately with cached data (if any)
    const unsubscribe = streamManager.markets.subscribe((newMarkets) => {
      if (!hasReceivedData.current) {
        hasReceivedData.current = true;
        setIsInitialLoading(false);
      }

      setMarkets(newMarkets);
      setError(null);
    });

    return () => {
      unsubscribe();
    };
  }, [streamManager, isInitializing, autoSubscribe]);

  // If stream manager isn't ready yet, show loading
  if (!streamManager || isInitializing) {
    return {
      markets: EMPTY_MARKETS,
      cryptoMarkets: EMPTY_MARKETS,
      hip3Markets: EMPTY_MARKETS,
      isInitialLoading: true,
      error: null,
      refresh,
    };
  }

  return {
    markets,
    cryptoMarkets,
    hip3Markets,
    isInitialLoading,
    error,
    refresh,
  };
}
