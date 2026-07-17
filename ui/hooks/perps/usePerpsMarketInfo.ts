import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { MarketInfo } from '@metamask/perps-controller';
import {
  clearPerpsMarketInfoModuleCache,
  fetchMarketInfos,
  peekCachedMarketInfos,
} from '../../providers/perps/perps-cache';
import { getIsPerpsTerminalBackendEnabled } from '../../selectors/perps';
import { usePerpsCacheKey } from './usePerpsCacheKey';

export { clearPerpsMarketInfoModuleCache };

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
 * Until the fetch resolves the hook returns `undefined`, and callers should
 * fall back to safe defaults (e.g. szDecimals = 0).
 *
 * @param symbol - Asset symbol to look up (e.g. 'HYPE', 'BTC', 'xyz:TSLA')
 * @returns The matching MarketInfo, or undefined while loading / on error
 */
export function usePerpsMarketInfo(symbol: string): MarketInfo | undefined {
  const marketInfoCacheKey = usePerpsCacheKey();
  const useTerminalApi = useSelector(getIsPerpsTerminalBackendEnabled);

  const [marketInfos, setMarketInfos] = useState<MarketInfo[]>(
    () => peekCachedMarketInfos(marketInfoCacheKey, useTerminalApi) ?? [],
  );

  useEffect(() => {
    const cached = peekCachedMarketInfos(marketInfoCacheKey, useTerminalApi);
    if (cached) {
      setMarketInfos(cached);
      return undefined;
    }

    let cancelled = false;
    setMarketInfos([]);

    fetchMarketInfos(marketInfoCacheKey, useTerminalApi).then((infos) => {
      if (!cancelled) {
        setMarketInfos(infos);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [marketInfoCacheKey, useTerminalApi]);

  return marketInfos.find((m) => m.name.toLowerCase() === symbol.toLowerCase());
}
