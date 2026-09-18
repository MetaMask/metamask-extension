import { useState, useEffect, useCallback, useMemo } from 'react';
import type { PerpsMarketData } from '@metamask/perps-controller';
import { getDisplaySymbol } from '../../../components/app/perps/utils';
import { usePerpsStreamManager } from './usePerpsStreamManager';

/**
 * Return type for the usePerpsAssetNames hook.
 */
export type UsePerpsAssetNamesReturn = {
  /**
   * Resolve a market symbol to its full asset name (e.g. 'BTC' -> 'Bitcoin').
   *
   * Falls back to the display ticker (HIP-3 prefix stripped) when the symbol
   * is unknown or the market has no Terminal-provided name.
   */
  resolveAssetName: (symbol: string) => string;
};

// Stable empty array reference for initial state.
const EMPTY_MARKETS: PerpsMarketData[] = [];

/**
 * Hook that resolves perps market symbols to their full asset names.
 *
 * Backed by the shared PerpsStreamManager markets channel, so calling it from
 * multiple components does not trigger extra network requests. Unlike
 * `usePerpsLiveMarketData`, the full (unfiltered) market list is used so that
 * positions/orders on low-volume or delisted markets still resolve a name.
 *
 * @returns An object exposing a `resolveAssetName` function.
 * @example
 * ```tsx
 * const { resolveAssetName } = usePerpsAssetNames();
 * const name = resolveAssetName(position.symbol); // 'Bitcoin'
 * ```
 */
export function usePerpsAssetNames(): UsePerpsAssetNamesReturn {
  const { streamManager, isInitializing } = usePerpsStreamManager();

  // Initialize from cache synchronously when available.
  const [markets, setMarkets] = useState<PerpsMarketData[]>(() => {
    if (streamManager) {
      return streamManager.markets.getCachedData();
    }
    return EMPTY_MARKETS;
  });

  useEffect(() => {
    if (isInitializing || !streamManager) {
      return undefined;
    }

    // Subscribe - callback fires immediately with cached data (if any).
    const unsubscribe = streamManager.markets.subscribe((newMarkets) => {
      setMarkets(newMarkets);
    });

    return () => {
      unsubscribe();
    };
  }, [streamManager, isInitializing]);

  // Build a symbol -> name lookup from the full (unfiltered) market list.
  const nameBySymbol = useMemo(() => {
    const map = new Map<string, string>();
    for (const market of markets) {
      if (market.symbol && market.name) {
        map.set(market.symbol.toUpperCase(), market.name);
      }
    }
    return map;
  }, [markets]);

  const resolveAssetName = useCallback(
    (symbol: string): string => {
      if (!symbol) {
        return symbol;
      }
      return nameBySymbol.get(symbol.toUpperCase()) || getDisplaySymbol(symbol);
    },
    [nameBySymbol],
  );

  return { resolveAssetName };
}
