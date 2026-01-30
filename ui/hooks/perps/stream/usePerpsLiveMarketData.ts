import { useState, useEffect, useCallback } from 'react';
import { usePerpsStream } from '../../../providers/perps';
import type { PerpsMarketData } from '../../../../app/scripts/controllers/perps/types';

/**
 * Options for usePerpsLiveMarketData hook
 */
export interface UsePerpsLiveMarketDataOptions {
  /**
   * Whether to auto-subscribe on mount
   * @default true
   */
  autoSubscribe?: boolean;
}

/**
 * Return type for usePerpsLiveMarketData hook
 */
export interface UsePerpsLiveMarketDataReturn {
  /**
   * All market data from the stream
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
   * Error if subscription failed
   */
  error: Error | null;

  /**
   * Manually refresh market data
   */
  refresh: () => void;
}

/**
 * Hook for subscribing to real-time market data
 *
 * @param options - Hook options
 * @returns Market data and subscription state
 *
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
  const stream = usePerpsStream();

  const [markets, setMarkets] = useState<PerpsMarketData[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Derive crypto and HIP-3 markets
  const cryptoMarkets = markets.filter((m) => !m.marketSource);
  const hip3Markets = markets.filter((m) => m.marketSource);

  const refresh = useCallback(() => {
    // Clear cache and re-subscribe
    stream.marketData.clearCache();
    stream.marketData.subscribe({
      callback: (data) => {
        setMarkets(data);
      },
    });
  }, [stream]);

  useEffect(() => {
    if (!autoSubscribe) {
      setIsInitialLoading(false);
      return;
    }

    try {
      const unsubscribe = stream.marketData.subscribe({
        callback: (data) => {
          setMarkets(data);
          setIsInitialLoading(false);
          setError(null);
        },
      });

      return () => {
        unsubscribe();
      };
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Subscription failed'));
      setIsInitialLoading(false);
      return undefined;
    }
  }, [stream, autoSubscribe]);

  return {
    markets,
    cryptoMarkets,
    hip3Markets,
    isInitialLoading,
    error,
    refresh,
  };
}
