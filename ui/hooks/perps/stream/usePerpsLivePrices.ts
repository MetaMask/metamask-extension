import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import { isEqual } from 'lodash';
import type { PriceUpdate } from '@metamask/perps-controller';
import type { PerpsStreamManager } from '../../../providers/perps/PerpsStreamManager';
import { submitRequestToBackground } from '../../../store/background-connection';
import { usePerpsStreamManager } from './usePerpsStreamManager';

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
  /** Whether the consumed snapshot came from this session's live stream. */
  isLive: boolean;
  /** Whether we're waiting for the first data */
  isInitialLoading: boolean;
};

const EMPTY_PRICES: PriceUpdate[] = [];
const EMPTY_PRICES_RECORD: Record<string, PriceUpdate> = {};

/**
 * Cache a selected external-store snapshot so unrelated prices retain its identity.
 * @param streamManager - Current account's stream manager.
 * @param isInitializing - Whether account initialization is pending.
 * @param symbolsKey - Canonical requested symbols, or empty for all prices.
 * @returns A stable snapshot reader for useSyncExternalStore.
 */
function createPriceSnapshotReader(
  streamManager: PerpsStreamManager | null,
  isInitializing: boolean,
  symbolsKey: string,
): () => UsePerpsLivePricesReturn {
  const requestedSymbols = new Set(symbolsKey ? symbolsKey.split('|') : []);
  let previousPrices: PriceUpdate[] = EMPTY_PRICES;
  let previous: UsePerpsLivePricesReturn | undefined;
  return (): UsePerpsLivePricesReturn => {
    const isInitialLoading =
      !streamManager || isInitializing || !streamManager.prices.hasCachedData();
    const allPrices = isInitialLoading
      ? EMPTY_PRICES
      : streamManager.prices.getCachedData();
    const selected =
      requestedSymbols.size === 0
        ? allPrices
        : allPrices.filter((price) => requestedSymbols.has(price.symbol));
    const isLive = Boolean(
      !isInitialLoading &&
      streamManager.hasLivePrices(allPrices) &&
      selected.some((price) => Number(price.price) > 0),
    );
    if (
      previous &&
      previous.isInitialLoading === isInitialLoading &&
      previous.isLive === isLive &&
      isEqual(previousPrices, selected)
    ) {
      return previous;
    }
    // Apply fallback timestamps only to changed snapshots so reads stay stable.
    const prices: Record<string, PriceUpdate> =
      selected.length === 0 ? EMPTY_PRICES_RECORD : {};
    selected.forEach((update) => {
      prices[update.symbol] = {
        ...update,
        timestamp: update.timestamp ?? Date.now(),
        markPrice: update.markPrice,
      };
    });
    previousPrices = selected;
    previous = { prices, isInitialLoading, isLive };
    return previous;
  };
}

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
  const { streamManager, isInitializing } = usePerpsStreamManager();

  useEffect(() => {
    if (!activateStream || !symbolsKey || !streamManager || isInitializing) {
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
  }, [
    activateStream,
    includeMarketData,
    symbolsKey,
    streamManager,
    isInitializing,
  ]);

  const subscribe = useCallback(
    (notify: () => void) => {
      if (!streamManager || isInitializing) {
        return () => undefined;
      }
      return streamManager.prices.subscribe(notify);
    },
    [streamManager, isInitializing],
  );

  // A different symbol selection needs a fresh snapshot cache immediately.
  const getSnapshot = useMemo(
    () => createPriceSnapshotReader(streamManager, isInitializing, symbolsKey),
    [streamManager, isInitializing, symbolsKey],
  );

  return useSyncExternalStore(subscribe, getSnapshot);
}
