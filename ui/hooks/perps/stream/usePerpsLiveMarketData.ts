import { useState, useEffect, useCallback, useRef } from 'react';
import { usePerpsClient } from '../../../providers/perps';
import type { PerpsMarketData } from '../../../providers/perps';

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
   * Note: In mock mode, this is a no-op as data comes from static mocks
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
  const client = usePerpsClient();

  const [markets, setMarkets] = useState<PerpsMarketData[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Derive crypto and HIP-3 markets
  const cryptoMarkets = markets.filter((m) => !m.marketSource);
  const hip3Markets = markets.filter((m) => m.marketSource);

  const refresh = useCallback(() => {
    // Unsubscribe and resubscribe to trigger new data
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    try {
      unsubscribeRef.current = client.streams.marketData.subscribe({
        callback: (data) => {
          setMarkets(data);
          setIsInitialLoading(false);
          setError(null);
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Refresh failed'));
    }
  }, [client]);

  useEffect(() => {
    if (!autoSubscribe) {
      setIsInitialLoading(false);
      return;
    }

    try {
      unsubscribeRef.current = client.streams.marketData.subscribe({
        callback: (data) => {
          setMarkets(data);
          setIsInitialLoading(false);
          setError(null);
        },
      });

      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
      };
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Subscription failed'));
      setIsInitialLoading(false);
      return undefined;
    }
  }, [client, autoSubscribe]);

  return {
    markets,
    cryptoMarkets,
    hip3Markets,
    isInitialLoading,
    error,
    refresh,
  };
}
