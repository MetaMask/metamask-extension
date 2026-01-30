import { useEffect, useState, useRef } from 'react';
import { usePerpsStream, type TopOfBookData } from '../../../providers/perps';

/**
 * Options for usePerpsTopOfBook hook
 */
export interface UsePerpsTopOfBookOptions {
  /** Symbol to get top of book for (e.g., 'BTC', 'ETH') */
  symbol: string;
}

/**
 * Return type for usePerpsTopOfBook hook
 */
export interface UsePerpsTopOfBookReturn {
  /** Top of book data (best bid/ask) */
  topOfBook: TopOfBookData | undefined;
  /** Whether we're waiting for the first real data */
  isInitialLoading: boolean;
}

/**
 * Hook for real-time top of book (best bid/ask) data via stream subscription
 *
 * This is a lightweight alternative to usePerpsLiveOrderBook when you only
 * need the best bid and ask prices.
 *
 * @param options - Configuration options
 * @returns Object containing top of book data and loading state
 *
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
  const stream = usePerpsStream();
  const [topOfBook, setTopOfBook] = useState<TopOfBookData | undefined>(
    undefined,
  );
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const hasReceivedFirstUpdate = useRef(false);

  useEffect(() => {
    if (!symbol) {
      setTopOfBook(undefined);
      setIsInitialLoading(false);
      return undefined;
    }

    const unsubscribe = stream.topOfBook.subscribeToSymbol({
      symbol,
      callback: (data) => {
        if (!hasReceivedFirstUpdate.current) {
          hasReceivedFirstUpdate.current = true;
          setIsInitialLoading(false);
        }
        setTopOfBook(data);
      },
    });

    return () => {
      unsubscribe();
    };
  }, [stream, symbol]);

  return { topOfBook, isInitialLoading };
}

// Re-export TopOfBookData for convenience
export type { TopOfBookData };
