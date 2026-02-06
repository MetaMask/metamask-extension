import { useState, useEffect, useCallback } from 'react';
import type { PerpsMarketData } from '@metamask/perps-controller';
import { usePerpsController } from '../../../providers/perps';

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

/**
 * Hook for fetching market data with prices.
 *
 * Uses the PerpsController's getMarketDataWithPrices() HTTP method.
 * Note: This is not a subscription - it fetches data on mount and
 * can be manually refreshed.
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
  const controller = usePerpsController();

  const [markets, setMarkets] = useState<PerpsMarketData[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Derive crypto and HIP-3 markets
  const cryptoMarkets = markets.filter((m) => !m.marketSource);
  const hip3Markets = markets.filter((m) => m.marketSource);

  const fetchMarketData = useCallback(async () => {
    try {
      // Get active provider to fetch market data
      const provider = controller.getActiveProviderOrNull();
      if (!provider) {
        setError(new Error('Provider not initialized'));
        setIsInitialLoading(false);
        return;
      }

      const data = await provider.getMarketDataWithPrices();
      setMarkets(data);
      setIsInitialLoading(false);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Failed to fetch market data'),
      );
      setIsInitialLoading(false);
    }
  }, [controller]);

  const refresh = useCallback(() => {
    fetchMarketData();
  }, [fetchMarketData]);

  useEffect(() => {
    // Reset state when controller changes (account switch)
    setMarkets([]);
    setIsInitialLoading(true);
    setError(null);

    if (!autoSubscribe) {
      setIsInitialLoading(false);
      return;
    }

    fetchMarketData();
  }, [autoSubscribe, fetchMarketData]);

  return {
    markets,
    cryptoMarkets,
    hip3Markets,
    isInitialLoading,
    error,
    refresh,
  };
}
