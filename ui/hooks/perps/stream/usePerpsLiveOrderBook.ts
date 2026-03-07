import { useEffect, useState, useRef } from 'react';
import { usePerpsController } from '../../../providers/perps';
import type { OrderBookData } from '@metamask/perps-controller';

/**
 * Options for usePerpsLiveOrderBook hook
 */
export type UsePerpsLiveOrderBookOptions = {
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
};

/**
 * Return type for usePerpsLiveOrderBook hook
 */
export type UsePerpsLiveOrderBookReturn = {
  /** Full order book data */
  orderBook: OrderBookData | null;
  /** Whether we're waiting for the first real data */
  isInitialLoading: boolean;
};

/**
 * Hook for real-time order book data via stream subscription
 *
 * Uses the PerpsController directly for WebSocket subscriptions.
 *
 * @param options - Configuration options
 * @returns Object containing order book data and loading state
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
  const { symbol, levels, nSigFigs, mantissa } = options;
  const controller = usePerpsController();
  const [orderBook, setOrderBook] = useState<OrderBookData | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const hasReceivedFirstUpdate = useRef(false);

  useEffect(() => {
    // Reset state when controller changes (account switch)
    setOrderBook(null);
    setIsInitialLoading(true);
    hasReceivedFirstUpdate.current = false;

    if (!symbol) {
      setOrderBook(null);
      setIsInitialLoading(false);
      return undefined;
    }

    const unsubscribe = controller.subscribeToOrderBook({
      symbol,
      levels: levels ?? 10,
      nSigFigs,
      mantissa,
      callback: (data) => {
        if (!hasReceivedFirstUpdate.current) {
          hasReceivedFirstUpdate.current = true;
          setIsInitialLoading(false);
        }
        setOrderBook(data);
      },
    });

    return () => {
      unsubscribe();
    };
  }, [controller, symbol, levels, nSigFigs, mantissa]);

  return { orderBook, isInitialLoading };
}
