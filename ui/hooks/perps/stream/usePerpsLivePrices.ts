import type { PriceUpdate } from '@metamask/perps-controller';
import type { PerpsStreamManager } from '../../../providers/perps';
import { submitRequestToBackground } from '../../../store/background-connection';
import { usePerpsChannel } from './usePerpsChannel';
import { useEffect, useMemo } from 'react';

/**
 * Options for usePerpsLivePrices hook
 */
export type UsePerpsLivePricesOptions = {
  /** Array of symbols to subscribe to (e.g., ['BTC', 'ETH']) */
  symbols: string[];
  /** Throttle delay in milliseconds (default: 0 - no throttling) */
  throttleMs?: number;
  /** Whether to activate the background price stream for these symbols */
  activateStream?: boolean;
  /** Optional passthrough for controller market data enrichment */
  includeMarketData?: boolean;
};

/**
 * Return type for usePerpsLivePrices hook
 */
export type UsePerpsLivePricesReturn = {
  /** Map of symbol to price update */
  prices: Record<string, PriceUpdate>;
  /** Whether we're waiting for the first data */
  isInitialLoading: boolean;
};

// Stable empty object reference to prevent re-renders
const EMPTY_PRICES: PriceUpdate[] = [];
const EMPTY_PRICES_RECORD: Record<string, PriceUpdate> = {};

const getPricesChannel = (sm: PerpsStreamManager) => sm.prices;

/**
 * Hook for real-time price updates via background stream notifications.
 *
 * Receives data pushed from the background PerpsController via
 * perpsStreamUpdate notifications → PerpsStreamManager.handleBackgroundUpdate().
 *
 * @param options - Configuration options
 * @returns Object containing prices map and loading state
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
  const {
    symbols,
    activateStream = false,
    includeMarketData = false,
  } = options;
  const symbolsKey = useMemo(
    () => Array.from(new Set(symbols)).sort().join('|'),
    [symbols],
  );

  useEffect(() => {
    if (!activateStream || !symbolsKey) {
      return undefined;
    }

    const activeSymbols = symbolsKey.split('|');

    submitRequestToBackground('perpsActivatePriceStream', [
      { symbols: activeSymbols, includeMarketData },
    ]).catch((err) => {
      // Background may not be ready yet; keep this best-effort and rely on
      // later retries or future consumers to react to stream data.
      console.debug('[usePerpsLivePrices] perpsActivatePriceStream failed:', err);
    });

    return () => {
      submitRequestToBackground('perpsDeactivatePriceStream', []).catch(
        (err) => {
          // Expected when the port closes before cleanup completes.
          console.debug(
            '[usePerpsLivePrices] perpsDeactivatePriceStream failed:',
            err,
          );
        },
      );
    };
  }, [activateStream, symbolsKey, includeMarketData]);

  const { data: priceArray, isInitialLoading } = usePerpsChannel(
    getPricesChannel,
    EMPTY_PRICES,
  );

  if (isInitialLoading || priceArray.length === 0) {
    return { prices: EMPTY_PRICES_RECORD, isInitialLoading };
  }

  // Convert array to record, filtered to requested symbols
  const priceRecord: Record<string, PriceUpdate> = {};
  priceArray.forEach((update) => {
    if (symbols.length === 0 || symbols.includes(update.symbol)) {
      const ts = (update as { timestamp?: number }).timestamp;
      const mark = (update as { markPrice?: string }).markPrice;
      priceRecord[update.symbol] = {
        ...update,
        timestamp: ts ?? Date.now(),
        markPrice: mark,
      };
    }
  });

  return { prices: priceRecord, isInitialLoading };
}
