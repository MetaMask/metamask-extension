import { useEffect, useState, useRef } from 'react';
import { usePerpsClient } from '../../../providers/perps';
import type { CandleData, CandlePeriod, TimeDuration } from '../../../providers/perps';

/**
 * Options for usePerpsLiveCandles hook
 */
export interface UsePerpsLiveCandlesOptions {
  /** Symbol to get candles for (e.g., 'BTC', 'ETH') */
  symbol: string;
  /** Candle interval (e.g., CandlePeriod.OneHour) */
  interval: CandlePeriod;
  /** Optional time duration for historical data */
  duration?: TimeDuration;
  /** Callback for errors */
  onError?: (error: Error) => void;
}

/**
 * Return type for usePerpsLiveCandles hook
 */
export interface UsePerpsLiveCandlesReturn {
  /** Candle data for the symbol */
  candleData: CandleData | null;
  /** Whether we're waiting for the first real data */
  isInitialLoading: boolean;
}

/**
 * Hook for real-time candlestick data via stream subscription
 *
 * @param options - Configuration options
 * @returns Object containing candle data and loading state
 *
 * @example
 * ```tsx
 * import { CandlePeriod } from '../../providers/perps';
 *
 * function CandleChart() {
 *   const { candleData, isInitialLoading } = usePerpsLiveCandles({
 *     symbol: 'BTC',
 *     interval: CandlePeriod.OneHour,
 *   });
 *
 *   if (isInitialLoading) return <Spinner />;
 *   if (!candleData) return <div>No data</div>;
 *
 *   return <Chart candles={candleData.candles} />;
 * }
 * ```
 */
export function usePerpsLiveCandles(
  options: UsePerpsLiveCandlesOptions,
): UsePerpsLiveCandlesReturn {
  const { symbol, interval, duration, onError } = options;
  const client = usePerpsClient();
  const [candleData, setCandleData] = useState<CandleData | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const hasReceivedFirstUpdate = useRef(false);

  useEffect(() => {
    if (!symbol || !interval) {
      setCandleData(null);
      setIsInitialLoading(false);
      return undefined;
    }

    const unsubscribe = client.streams.candles.subscribe({
      symbol,
      interval,
      duration,
      callback: (data) => {
        if (!hasReceivedFirstUpdate.current) {
          hasReceivedFirstUpdate.current = true;
          setIsInitialLoading(false);
        }
        setCandleData(data);
      },
      onError,
    });

    return () => {
      unsubscribe();
    };
  }, [client, symbol, interval, duration, onError]);

  return { candleData, isInitialLoading };
}
