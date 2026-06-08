import { useEffect } from 'react';
import type { OrderBookData } from '@metamask/perps-controller';
import type { PerpsStreamManager } from '../../../providers/perps';
import { submitRequestToBackground } from '../../../store/background-connection';
import { usePerpsChannel } from './usePerpsChannel';

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
 * Activates the background order-book stream for `symbol` (mirrors
 * `usePerpsTopOfBook` / mobile's subscribeToOrderBook wiring) and reads from
 * the shared PerpsStreamManager channel.
 *
 * @param options - Configuration options
 * @returns Object containing order book data and loading state
 */
export function usePerpsLiveOrderBook(
  options: UsePerpsLiveOrderBookOptions,
): UsePerpsLiveOrderBookReturn {
  const { symbol } = options;

  const { data: orderBook, isInitialLoading } = usePerpsChannel(
    getOrderBookChannel,
    null,
    symbol || undefined,
  );

  useEffect(() => {
    if (!symbol) {
      return undefined;
    }
    submitRequestToBackground('perpsActivateOrderBookStream', [
      { symbol },
    ]).catch(() => {
      // Controller not ready yet — stream will activate on retry when symbol changes.
    });
    return () => {
      submitRequestToBackground('perpsDeactivateOrderBookStream', []).catch(
        () => {
          // Best-effort teardown.
        },
      );
    };
  }, [symbol]);

  return {
    orderBook,
    isInitialLoading: isInitialLoading || !symbol,
  };
}
