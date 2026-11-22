import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { MarketInfo } from '@metamask/perps-controller';
import {
  clearPerpsMarketInfoModuleCache,
  fetchMarketInfos,
  invalidateCachedMarketInfos,
  peekCachedMarketInfos,
} from '../../providers/perps/perps-cache';
import { getIsPerpsTerminalBackendEnabled } from '../../selectors/perps';
import { usePerpsCacheKey } from './usePerpsCacheKey';

export { clearPerpsMarketInfoModuleCache };

function isSymbolMatch(candidate: MarketInfo, symbol: string): boolean {
  return candidate.name.toLowerCase() === symbol.toLowerCase();
}

export type UsePerpsMarketInfoReturn = {
  /** Matching market metadata, when the list has resolved and the symbol exists */
  market: MarketInfo | undefined;
  /** True until the market list fetch has settled for the current scope */
  isLoading: boolean;
  /** Fetches the market list again, e.g. after a failed lookup */
  retry: () => void;
};

/**
 * Fetches the full MarketInfo for a specific asset symbol.
 *
 * MarketInfo includes fields not present in the streaming PerpsMarketData
 * (e.g. szDecimals, maxLeverage as a number, marginTableId), which are
 * required for accurate pre-trade calculations that mirror the mobile app.
 *
 * The market list is fetched once per Perps scope (active provider, mainnet
 * vs testnet, and selected wallet address) and cached at module level so
 * navigating between detail pages does not trigger additional REST calls for
 * the same scope. `PerpsStreamManager` clears this cache alongside its own
 * channels on account / stream reset.
 *
 * `isLoading` is distinct from "no match": while the list is in flight the
 * hook returns `{ market: undefined, isLoading: true }`; after it settles with
 * no matching symbol it returns `{ market: undefined, isLoading: false }`.
 * Callers that choose UI from a match (for example the asset page Long / Short
 * vs Buy / Swap row) should wait on `isLoading` rather than treating
 * `undefined` as "no Perps market".
 *
 * @param symbol - Asset symbol to look up (e.g. 'HYPE', 'BTC', 'xyz:TSLA')
 * @param options - Hook options
 * @param options.enabled - When false, skips fetching and returns no market
 * with `isLoading: false`. Used by callers outside the Perps experience that
 * must not trigger market fetches when Perps is unavailable.
 * @returns The matching market and whether the list lookup is still in flight
 */
export function usePerpsMarketInfo(
  symbol: string,
  { enabled = true }: { enabled?: boolean } = {},
): UsePerpsMarketInfoReturn {
  const marketInfoCacheKey = usePerpsCacheKey();
  const useTerminalApi = useSelector(getIsPerpsTerminalBackendEnabled);

  const lookupKey = `${enabled}|${marketInfoCacheKey}|${useTerminalApi}`;
  const [prevLookupKey, setPrevLookupKey] = useState(lookupKey);
  const [retryCount, setRetryCount] = useState(0);

  const [marketInfos, setMarketInfos] = useState<MarketInfo[] | undefined>(
    () => {
      if (enabled) {
        return peekCachedMarketInfos(marketInfoCacheKey, useTerminalApi);
      }
      return undefined;
    },
  );
  const [isLoading, setIsLoading] = useState(() => {
    if (enabled) {
      return (
        peekCachedMarketInfos(marketInfoCacheKey, useTerminalApi) === undefined
      );
    }
    return false;
  });

  if (lookupKey !== prevLookupKey) {
    setPrevLookupKey(lookupKey);
    if (enabled) {
      const cached = peekCachedMarketInfos(marketInfoCacheKey, useTerminalApi);
      setMarketInfos(cached);
      setIsLoading(cached === undefined);
    } else {
      setMarketInfos(undefined);
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    // State was seeded from a warm cache. After a retry, read through
    // fetchMarketInfos even if the list is warm again, so loading settles.
    const cached = peekCachedMarketInfos(marketInfoCacheKey, useTerminalApi);
    if (cached && retryCount === 0) {
      return undefined;
    }

    let cancelled = false;

    fetchMarketInfos(marketInfoCacheKey, useTerminalApi).then((infos) => {
      if (!cancelled) {
        setMarketInfos(infos);
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [marketInfoCacheKey, useTerminalApi, enabled, retryCount]);

  // Reuse a cached list that has the symbol (another consumer may have
  // fetched it after this one failed); otherwise refetch the scope, since a
  // cached empty or incomplete list would never contain it.
  const retry = useCallback(() => {
    if (!enabled) {
      return;
    }
    const cached = peekCachedMarketInfos(marketInfoCacheKey, useTerminalApi);
    if (cached?.some((candidate) => isSymbolMatch(candidate, symbol))) {
      setMarketInfos(cached);
      setIsLoading(false);
      return;
    }
    invalidateCachedMarketInfos(marketInfoCacheKey, useTerminalApi);
    setIsLoading(true);
    setRetryCount((count) => count + 1);
  }, [enabled, marketInfoCacheKey, useTerminalApi, symbol]);

  if (!enabled) {
    return { market: undefined, isLoading: false, retry };
  }

  const market = marketInfos?.find((candidate) =>
    isSymbolMatch(candidate, symbol),
  );

  return { market, isLoading, retry };
}
