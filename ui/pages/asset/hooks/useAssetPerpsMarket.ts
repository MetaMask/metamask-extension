import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { MarketInfo } from '@metamask/perps-controller';
import {
  getIsPerpsExperienceAvailable,
  getIsPerpsTerminalBackendEnabled,
} from '../../../selectors/perps';
import { submitRequestToBackground } from '../../../store/background-connection';

export type UseAssetPerpsMarketReturn = {
  /** Matching Perps market for the wallet asset, when one exists */
  market: MarketInfo | undefined;
  /** True until the targeted market lookup has resolved */
  isLoading: boolean;
};

type AssetPerpsMarketCacheEntry = {
  resolved: boolean;
  market: MarketInfo | undefined;
  inflight: Promise<MarketInfo | undefined> | null;
};

const marketCacheByKey = new Map<string, AssetPerpsMarketCacheEntry>();

function buildAssetPerpsMarketCacheKey(
  symbol: string,
  useTerminalApi: boolean,
): string {
  return `${symbol.toLowerCase()}|${useTerminalApi ? 'terminal' : 'direct'}`;
}

function getAssetPerpsMarketCacheEntry(
  symbol: string,
  useTerminalApi: boolean,
): AssetPerpsMarketCacheEntry {
  const key = buildAssetPerpsMarketCacheKey(symbol, useTerminalApi);
  let entry = marketCacheByKey.get(key);
  if (!entry) {
    entry = { resolved: false, market: undefined, inflight: null };
    marketCacheByKey.set(key, entry);
  }
  return entry;
}

/**
 * Drops the per-symbol market lookup cache. Used by tests so each case starts
 * from an unresolved fetch.
 */
export function clearAssetPerpsMarketCache(): void {
  marketCacheByKey.clear();
}

function findMatchingMarket(
  infos: MarketInfo[],
  symbol: string,
): MarketInfo | undefined {
  const needle = symbol.toLowerCase();
  return infos.find((candidate) => candidate.name.toLowerCase() === needle);
}

/**
 * Looks up the Perps market for a symbol, caching successful hits and misses.
 *
 * A rejected `perpsGetMarkets` call is not cached as resolved, so a later
 * visit retries instead of permanently hiding Long / Short.
 *
 * @param symbol - The wallet asset's symbol (e.g. 'ETH', 'DAI')
 * @param useTerminalApi - Whether to fetch markets from the terminal backend
 * @returns The matching market, or undefined when none exists or the lookup fails
 */
function fetchAssetPerpsMarket(
  symbol: string,
  useTerminalApi: boolean,
): Promise<MarketInfo | undefined> {
  const entry = getAssetPerpsMarketCacheEntry(symbol, useTerminalApi);
  if (entry.resolved) {
    return Promise.resolve(entry.market);
  }
  if (!entry.inflight) {
    entry.inflight = submitRequestToBackground<MarketInfo[]>(
      'perpsGetMarkets',
      [
        {
          symbols: [symbol],
          standalone: true,
          useTerminalApi,
        },
      ],
    )
      .then((infos) => {
        const market = findMatchingMarket(
          Array.isArray(infos) ? infos : [],
          symbol,
        );
        entry.market = market;
        entry.resolved = true;
        entry.inflight = null;
        return market;
      })
      .catch(() => {
        entry.inflight = null;
        return undefined;
      });
  }
  return entry.inflight;
}

/**
 * Finds the Perps market matching a wallet asset's symbol, mirroring mobile's
 * `usePerpsMarketForAsset`.
 *
 * Uses a targeted `getMarkets({ symbols: [symbol], standalone: true })` request
 * rather than the full `usePerpsMarketInfo` list, so the first visit does not
 * wait on every market before the asset page can choose Long / Short vs Buy /
 * Swap. `isLoading` is distinct from "no market", so callers can keep a
 * skeleton up until the match resolves instead of flashing the wrong actions.
 *
 * @param symbol - The wallet asset's symbol (e.g. 'ETH', 'DAI')
 * @returns The matching market and whether the lookup is still in flight
 */
export function useAssetPerpsMarket(symbol: string): UseAssetPerpsMarketReturn {
  const isPerpsAvailable = useSelector(getIsPerpsExperienceAvailable);
  const useTerminalApi = useSelector(getIsPerpsTerminalBackendEnabled);

  const lookupKey = `${isPerpsAvailable}|${symbol}|${useTerminalApi}`;
  const [prevLookupKey, setPrevLookupKey] = useState(lookupKey);
  const [market, setMarket] = useState<MarketInfo | undefined>(() => {
    if (!isPerpsAvailable) {
      return undefined;
    }
    const entry = getAssetPerpsMarketCacheEntry(symbol, useTerminalApi);
    return entry.resolved ? entry.market : undefined;
  });
  const [isLoading, setIsLoading] = useState(() => {
    if (!isPerpsAvailable || !symbol) {
      return false;
    }
    return !getAssetPerpsMarketCacheEntry(symbol, useTerminalApi).resolved;
  });

  if (lookupKey !== prevLookupKey) {
    setPrevLookupKey(lookupKey);
    if (!isPerpsAvailable || !symbol) {
      setMarket(undefined);
      setIsLoading(false);
    } else {
      const cached = getAssetPerpsMarketCacheEntry(symbol, useTerminalApi);
      setMarket(cached.resolved ? cached.market : undefined);
      setIsLoading(!cached.resolved);
    }
  }

  useEffect(() => {
    if (!isPerpsAvailable || !symbol) {
      return undefined;
    }

    const cached = getAssetPerpsMarketCacheEntry(symbol, useTerminalApi);
    if (cached.resolved) {
      return undefined;
    }

    let cancelled = false;

    fetchAssetPerpsMarket(symbol, useTerminalApi).then((nextMarket) => {
      if (!cancelled) {
        setMarket(nextMarket);
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isPerpsAvailable, symbol, useTerminalApi]);

  if (!isPerpsAvailable) {
    return { market: undefined, isLoading: false };
  }

  return { market, isLoading };
}
