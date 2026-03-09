import { useEffect, useState, useRef } from 'react';
import { submitRequestToBackground } from '../../../store/background-connection';
import type { PerpsStreamManager } from '../../../providers/perps';
import { usePerpsChannel } from './usePerpsChannel';

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

const getOrderBookChannel = (sm: PerpsStreamManager) => sm.orderBook;

/**
 * Hook for real-time top of book (best bid/ask) data via background stream.
 *
 * Tells the background to activate an orderBook stream for the given symbol,
 * then reads from the shared orderBook channel in PerpsStreamManager.
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
  const [topOfBook, setTopOfBook] = useState<TopOfBookData | undefined>(
    undefined,
  );
  const hasActivated = useRef(false);

  const { data: orderBookData, isInitialLoading } = usePerpsChannel(
    getOrderBookChannel,
    null,
  );

  // Activate the background orderBook stream for this symbol
  useEffect(() => {
    if (!symbol) {
      return;
    }
    hasActivated.current = true;
    submitRequestToBackground('perpsActivateOrderBookStream', [
      { symbol },
    ]).catch((err) =>
      console.warn('[usePerpsTopOfBook] activate streaming failed:', err),
    );
    return () => {
      submitRequestToBackground('perpsDeactivateOrderBookStream', []);
    };
  }, [symbol]);

  // Extract top of book from the orderBook channel data
  useEffect(() => {
    if (!orderBookData) {
      setTopOfBook(undefined);
      return;
    }

    if (orderBookData.bids.length > 0 && orderBookData.asks.length > 0) {
      const topBid = orderBookData.bids[0];
      const topAsk = orderBookData.asks[0];

      setTopOfBook({
        bestBid: topBid.price,
        bestBidSize: topBid.size,
        bestAsk: topAsk.price,
        bestAskSize: topAsk.size,
        spread: orderBookData.spread,
        spreadPercent: orderBookData.spreadPercentage,
        midPrice: orderBookData.midPrice,
      });
    } else {
      setTopOfBook(undefined);
    }
  }, [orderBookData]);

  return {
    topOfBook,
    isInitialLoading: isInitialLoading || (!hasActivated.current && !symbol),
  };
}
