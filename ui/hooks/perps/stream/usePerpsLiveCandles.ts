import { useEffect, useState, useRef, useCallback } from 'react';
import type {
  CandlePeriod,
  TimeDuration,
} from '../../../components/app/perps/constants/chartConfig';
import { getPerpsStreamManager } from '../../../providers/perps/PerpsStreamManager';
import type { CandleData } from '@metamask/perps-controller';

/**
 * Options for usePerpsLiveCandles hook
 */
export type UsePerpsLiveCandlesOptions = {
  /** Symbol to get candles for (e.g., 'BTC', 'ETH') */
  symbol: string;
  /** Candle interval (e.g., CandlePeriod.OneHour) */
  interval: CandlePeriod;
  /** Time duration for initial historical data and load-more sizing */
  duration?: TimeDuration;
  /** Throttle interval in ms for live updates (default 1000) */
  throttleMs?: number;
  /** Callback for errors */
  onError?: (error: Error) => void;
};

/**
 * Return type for usePerpsLiveCandles hook
 */
export type UsePerpsLiveCandlesReturn = {
  /** Candle data for the symbol */
  candleData: CandleData | null;
  /** Whether we're waiting for the first real data */
  isInitialLoading: boolean;
  /** Whether we're fetching more historical data (scroll-left load-more) */
  isLoadingMore: boolean;
  /** Whether historical data exists (more candles may be available) */
  hasHistoricalData: boolean;
  /** Error from subscription or fetch */
  error: Error | null;
  /** Fetch older historical candles (called on scroll-left edge detection) */
  fetchMoreHistory: () => void;
};

/**
 * Hook for real-time candlestick data via CandleStreamChannel.
 *
 * Routes through PerpsStreamManager.candles for subscription deduplication,
 * caching, and throttling. Multiple consumers (chart, OHLCV bar, fullscreen)
 * sharing the same symbol+interval will share one controller subscription.
 *
 * @param options - Configuration options
 * @returns Object containing candle data, loading states, error, and fetchMoreHistory
 * @example
 * ```tsx
 * import { CandlePeriod, TimeDuration } from '@metamask/perps-controller';
 *
 * function CandleChart() {
 *   const {
 *     candleData,
 *     isInitialLoading,
 *     isLoadingMore,
 *     error,
 *     fetchMoreHistory,
 *   } = usePerpsLiveCandles({
 *     symbol: 'BTC',
 *     interval: CandlePeriod.OneHour,
 *     duration: TimeDuration.YearToDate,
 *     throttleMs: 1000,
 *   });
 *
 *   if (isInitialLoading) return <Spinner />;
 *   if (error && !candleData) return <ErrorState />;
 *
 *   return (
 *     <Chart
 *       candles={candleData?.candles}
 *       onNeedMoreHistory={fetchMoreHistory}
 *     />
 *   );
 * }
 * ```
 */
export function usePerpsLiveCandles(
  options: UsePerpsLiveCandlesOptions,
): UsePerpsLiveCandlesReturn {
  const { symbol, interval, duration, throttleMs = 1000, onError } = options;

  const [candleData, setCandleData] = useState<CandleData | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const hasReceivedFirstUpdate = useRef(false);

  // Stable refs for the current subscription params (for validation in callbacks)
  const currentSymbolRef = useRef(symbol);
  const currentIntervalRef = useRef(interval);
  currentSymbolRef.current = symbol;
  currentIntervalRef.current = interval;

  useEffect(() => {
    // Reset state when symbol or interval changes
    setCandleData(null);
    setIsInitialLoading(true);
    setError(null);
    hasReceivedFirstUpdate.current = false;

    if (!symbol || !interval) {
      setCandleData(null);
      setIsInitialLoading(false);
      return undefined;
    }

    const streamManager = getPerpsStreamManager();

    const unsubscribe = streamManager.candles.subscribe({
      symbol,
      interval,
      duration,
      throttleMs,
      callback: (data: CandleData) => {
        // Validate incoming data matches current subscription
        // (prevents stale data from race conditions during symbol/interval switch)
        if (
          data.symbol !== currentSymbolRef.current ||
          data.interval !== currentIntervalRef.current
        ) {
          return;
        }

        if (!hasReceivedFirstUpdate.current) {
          hasReceivedFirstUpdate.current = true;
          setIsInitialLoading(false);
        }
        setError(null);
        setCandleData(data);
      },
      onError: (err: Error) => {
        setError(err);
        if (!hasReceivedFirstUpdate.current) {
          setIsInitialLoading(false);
        }
        onError?.(err);
      },
    });

    return () => {
      unsubscribe();
    };
  }, [symbol, interval, duration, throttleMs, onError]);

  // Fetch more historical candles (scroll-left load-more)
  const fetchMoreHistory = useCallback(() => {
    if (isLoadingMore || !symbol || !interval || !duration) {
      return;
    }

    setIsLoadingMore(true);

    const streamManager = getPerpsStreamManager();
    streamManager.candles
      .fetchHistoricalCandles(symbol, interval, duration)
      .catch((err: unknown) => {
        console.error('[usePerpsLiveCandles] fetchMoreHistory failed:', err);
      })
      .finally(() => {
        setIsLoadingMore(false);
      });
  }, [symbol, interval, duration, isLoadingMore]);

  // Determine if historical data is available (candles exist = more might be loadable)
  const hasHistoricalData = Boolean(
    candleData?.candles && candleData.candles.length > 0,
  );

  return {
    candleData,
    isInitialLoading,
    isLoadingMore,
    hasHistoricalData,
    error,
    fetchMoreHistory,
  };
}
