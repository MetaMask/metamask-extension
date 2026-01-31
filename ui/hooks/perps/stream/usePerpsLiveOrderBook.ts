import { useEffect, useState, useRef } from 'react';
import { usePerpsClient } from '../../../providers/perps';
import type { OrderBookData } from '../../../providers/perps';

/**
 * Options for usePerpsLiveOrderBook hook
 */
export interface UsePerpsLiveOrderBookOptions {
  /** Symbol to get order book for (e.g., 'BTC', 'ETH') */
  symbol: string;
  /** Number of levels to return per side (default: 10) */
  levels?: number;
  /** Price aggregation significant figures (2-5, default: 5) */
  nSigFigs?: 2 | 3 | 4 | 5;
  /** Mantissa for aggregation when nSigFigs is 5 */
  mantissa?: 2 | 5;
  /** Callback for errors */
  onError?: (error: Error) => void;
}

/**
 * Return type for usePerpsLiveOrderBook hook
 */
export interface UsePerpsLiveOrderBookReturn {
  /** Full order book data */
  orderBook: OrderBookData | null;
  /** Whether we're waiting for the first real data */
  isInitialLoading: boolean;
}

/**
 * Hook for real-time order book data via stream subscription
 *
 * @param options - Configuration options
 * @returns Object containing order book data and loading state
 *
 * @example
 * ```tsx
 * function OrderBookDisplay() {
 *   const { orderBook, isInitialLoading } = usePerpsLiveOrderBook({
 *     symbol: 'BTC',
 *     levels: 10,
 *   });
 *
 *   if (isInitialLoading) return <Spinner />;
 *   if (!orderBook) return <div>No data</div>;
 *
 *   return (
 *     <div>
 *       <div>Asks: {orderBook.asks.length}</div>
 *       <div>Bids: {orderBook.bids.length}</div>
 *       <div>Spread: {orderBook.spread}</div>
 *     </div>
 *   );
 * }
 * ```
 */
export function usePerpsLiveOrderBook(
  options: UsePerpsLiveOrderBookOptions,
): UsePerpsLiveOrderBookReturn {
  const { symbol, levels, nSigFigs, mantissa, onError } = options;
  const client = usePerpsClient();
  const [orderBook, setOrderBook] = useState<OrderBookData | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const hasReceivedFirstUpdate = useRef(false);

  useEffect(() => {
    if (!symbol) {
      setOrderBook(null);
      setIsInitialLoading(false);
      return undefined;
    }

    const unsubscribe = client.streams.orderBook.subscribe({
      symbol,
      levels,
      nSigFigs,
      mantissa,
      callback: (data) => {
        if (!hasReceivedFirstUpdate.current) {
          hasReceivedFirstUpdate.current = true;
          setIsInitialLoading(false);
        }
        setOrderBook(data);
      },
      onError,
    });

    return () => {
      unsubscribe();
    };
  }, [client, symbol, levels, nSigFigs, mantissa, onError]);

  return { orderBook, isInitialLoading };
}
