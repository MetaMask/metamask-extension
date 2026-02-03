import { useEffect, useState, useRef } from 'react';
import { usePerpsController } from '../../../providers/perps';
import type { PriceUpdate } from '@metamask/perps-controller';

/**
 * Options for usePerpsLivePrices hook
 */
export interface UsePerpsLivePricesOptions {
  /** Array of symbols to subscribe to (e.g., ['BTC', 'ETH']) */
  symbols: string[];
  /** Throttle delay in milliseconds (default: 0 - no throttling) */
  throttleMs?: number;
}

/**
 * Return type for usePerpsLivePrices hook
 */
export interface UsePerpsLivePricesReturn {
  /** Map of symbol to price update */
  prices: Record<string, PriceUpdate>;
  /** Whether we're waiting for the first data */
  isInitialLoading: boolean;
}

// Stable empty object reference to prevent re-renders
const EMPTY_PRICES: Record<string, PriceUpdate> = {};

/**
 * Hook for real-time price updates via stream subscription
 *
 * Uses the PerpsController directly for WebSocket subscriptions.
 *
 * @param options - Configuration options
 * @returns Object containing prices map and loading state
 *
 * @example
 * ```tsx
 * function PriceDisplay() {
 *   const { prices, isInitialLoading } = usePerpsLivePrices({
 *     symbols: ['BTC', 'ETH'],
 *   });
 *
 *   if (isInitialLoading) return <Spinner />;
 *
 *   return (
 *     <div>
 *       BTC: {prices.BTC?.price}
 *       ETH: {prices.ETH?.price}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePerpsLivePrices(
  options: UsePerpsLivePricesOptions,
): UsePerpsLivePricesReturn {
  const { symbols, throttleMs = 0 } = options;
  const controller = usePerpsController();
  const [prices, setPrices] = useState<Record<string, PriceUpdate>>(EMPTY_PRICES);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const hasReceivedFirstUpdate = useRef(false);

  useEffect(() => {
    if (symbols.length === 0) {
      setPrices(EMPTY_PRICES);
      setIsInitialLoading(false);
      return undefined;
    }

    const unsubscribe = controller.subscribeToPrices({
      symbols,
      callback: (priceUpdates) => {
        if (!hasReceivedFirstUpdate.current) {
          hasReceivedFirstUpdate.current = true;
          setIsInitialLoading(false);
        }

        // Convert array to record for backward compatibility
        const priceRecord: Record<string, PriceUpdate> = {};
        priceUpdates.forEach((update) => {
          priceRecord[update.symbol] = update;
        });
        setPrices(priceRecord);
      },
      throttleMs,
    });

    return () => {
      unsubscribe();
    };
  }, [controller, symbols.join(','), throttleMs]);

  return { prices, isInitialLoading };
}
