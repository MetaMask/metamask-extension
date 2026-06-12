import { useEffect, useMemo } from 'react';
import type { PriceUpdate } from '@metamask/perps-controller';
import type { PerpsStreamManager } from '../../../providers/perps';
import { submitRequestToBackground } from '../../../store/background-connection';
import { usePerpsChannel } from './usePerpsChannel';

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
    () =>
      Array.from(new Set(symbols))
        .sort((left, right) => left.localeCompare(right))
        .join('|'),
    [symbols],
  );

  useEffect(() => {
    if (!activateStream || !symbolsKey) {
      return undefined;
    }

    // The background `prices` channel is currently a single shared stream.
    // Activating here is safe because the current product flow has one active
    // owner at a time; if we later support concurrent owners, the bridge API
    // should move to scoped subscriptions or ref-counted teardown.
    const activeSymbols = symbolsKey.split('|');

    submitRequestToBackground('perpsActivatePriceStream', [
      { symbols: activeSymbols, includeMarketData },
    ]).catch((error) => {
      // Background readiness can lag popup mounting; keep this best-effort.
      console.debug(
        '[usePerpsLivePrices] perpsActivatePriceStream failed:',
        error,
      );
    });

    return () => {
      submitRequestToBackground('perpsDeactivatePriceStream', []).catch(
        (error) => {
          // Expected when the background port closes before cleanup completes.
          console.debug(
            '[usePerpsLivePrices] perpsDeactivatePriceStream failed:',
            error,
          );
        },
      );
    };
  }, [activateStream, includeMarketData, symbolsKey]);

  const { data: priceArray, isInitialLoading } = usePerpsChannel<PriceUpdate[]>(
    getPricesChannel,
    EMPTY_PRICES,
  );

  const requestedSymbols = useMemo(
    () => (symbolsKey ? new Set(symbolsKey.split('|')) : new Set<string>()),
    [symbolsKey],
  );

  const prices = useMemo(() => {
    if (isInitialLoading || priceArray.length === 0) {
      return EMPTY_PRICES_RECORD;
    }

    const priceRecord: Record<string, PriceUpdate> = {};
    priceArray.forEach((update) => {
      if (requestedSymbols.size === 0 || requestedSymbols.has(update.symbol)) {
        priceRecord[update.symbol] = {
          ...update,
          timestamp: update.timestamp ?? Date.now(),
          markPrice: update.markPrice,
        };
      }
    });

    return priceRecord;
  }, [isInitialLoading, priceArray, requestedSymbols]);

  return { prices, isInitialLoading };
}
