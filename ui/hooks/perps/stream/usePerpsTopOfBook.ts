import { useEffect, useState, useRef } from 'react';
import { usePerpsController } from '../../../providers/perps';

/**
 * Top of book data (best bid/ask)
 */
export type TopOfBookData = {
  /** Best bid price */
  bestBid: string;
  /** Best bid size */
  bestBidSize: string;
  /** Best ask price */
  bestAsk: string;
  /** Best ask size */
  bestAskSize: string;
  /** Spread between best bid and ask */
  spread: string;
  /** Spread as percentage of mid price */
  spreadPercent: string;
  /** Mid price between bid and ask */
  midPrice: string;
};

/**
 * Options for usePerpsTopOfBook hook
 */
export type UsePerpsTopOfBookOptions = {
  /** Symbol to get top of book for (e.g., 'BTC', 'ETH') */
  symbol: string;
};

/**
 * Return type for usePerpsTopOfBook hook
 */
export type UsePerpsTopOfBookReturn = {
  /** Top of book data (best bid/ask) */
  topOfBook: TopOfBookData | undefined;
  /** Whether we're waiting for the first real data */
  isInitialLoading: boolean;
};

/**
 * Hook for real-time top of book (best bid/ask) data via stream subscription
 *
 * Uses the PerpsController directly for WebSocket subscriptions.
 * This is a lightweight alternative to usePerpsLiveOrderBook when you only
 * need the best bid and ask prices. Internally, it subscribes to the order book
 * stream and extracts the top level.
 *
 * @param options - Configuration options
 * @returns Object containing top of book data and loading state
 * @example
 * ```tsx
 * function SpreadDisplay() {
 *   const { topOfBook, isInitialLoading } = usePerpsTopOfBook({
 *     symbol: 'BTC',
 *   });
 *
 *   if (isInitialLoading) return <Spinner />;
 *   if (!topOfBook) return <div>No data</div>;
 *
 *   return (
 *     <div>
 *       <div>Bid: {topOfBook.bestBid}</div>
 *       <div>Ask: {topOfBook.bestAsk}</div>
 *       <div>Spread: {topOfBook.spread}</div>
 *     </div>
 *   );
 * }
 * ```
 */
export function usePerpsTopOfBook(
  options: UsePerpsTopOfBookOptions,
): UsePerpsTopOfBookReturn {
  const { symbol } = options;
  const controller = usePerpsController();
  const [topOfBook, setTopOfBook] = useState<TopOfBookData | undefined>(
    undefined,
  );
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const hasReceivedFirstUpdate = useRef(false);

  useEffect(() => {
    // Reset state when controller changes (account switch)
    setTopOfBook(undefined);
    setIsInitialLoading(true);
    hasReceivedFirstUpdate.current = false;

    if (!symbol) {
      setTopOfBook(undefined);
      setIsInitialLoading(false);
      return undefined;
    }

    // Subscribe to order book and extract top of book data
    const unsubscribe = controller.subscribeToOrderBook({
      symbol,
      levels: 1, // Only need top level
      nSigFigs: 5,
      mantissa: 2,
      callback: (orderBook) => {
        if (!hasReceivedFirstUpdate.current) {
          hasReceivedFirstUpdate.current = true;
          setIsInitialLoading(false);
        }

        // Extract top of book from order book data
        if (orderBook.bids.length > 0 && orderBook.asks.length > 0) {
          const topBid = orderBook.bids[0];
          const topAsk = orderBook.asks[0];

          setTopOfBook({
            bestBid: topBid.price,
            bestBidSize: topBid.size,
            bestAsk: topAsk.price,
            bestAskSize: topAsk.size,
            spread: orderBook.spread,
            spreadPercent: orderBook.spreadPercentage,
            midPrice: orderBook.midPrice,
          });
        } else {
          setTopOfBook(undefined);
        }
      },
    });

    return () => {
      unsubscribe();
    };
  }, [controller, symbol]);

  return { topOfBook, isInitialLoading };
}
