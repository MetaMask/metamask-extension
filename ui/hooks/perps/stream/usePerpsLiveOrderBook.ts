import type { OrderBookData } from '@metamask/perps-controller';
import { usePerpsChannel } from './usePerpsChannel';
import type { PerpsStreamManager } from '../../../providers/perps';

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

const getOrderBookChannel = (sm: PerpsStreamManager) => sm.orderBook;

/**
 * Hook for real-time order book data via background stream notifications.
 *
 * Receives data pushed from the background PerpsController via
 * perpsStreamUpdate notifications → PerpsStreamManager.handleBackgroundUpdate().
 *
 * Note: The background emits a single orderBook channel for the currently
 * subscribed symbol. The symbol/levels/nSigFigs parameters are used
 * for the perpsSubscriberChange registration (future: per-symbol scoping).
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
  // options.symbol is available for future per-symbol scoping
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { symbol: _symbol } = options;

  const { data: orderBook, isInitialLoading } = usePerpsChannel(
    getOrderBookChannel,
    null,
  );

  return { orderBook, isInitialLoading };
}
