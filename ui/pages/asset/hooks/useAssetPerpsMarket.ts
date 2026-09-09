import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { MarketInfo } from '@metamask/perps-controller';
import {
  getIsPerpsExperienceAvailable,
  getIsPerpsTerminalBackendEnabled,
} from '../../../selectors/perps';
import { getDisplaySymbol } from '../../../components/app/perps/utils';
import { submitRequestToBackground } from '../../../store/background-connection';

export type UseAssetPerpsMarketReturn = {
  /** Matching Perps market for the wallet asset, when one exists */
  market: MarketInfo | undefined;
  /** True until the targeted market lookup has resolved */
  isLoading: boolean;
};

type AssetPerpsMarketCacheEntry = {
  resolved: boolean;
  resolvedAt: number;
  market: MarketInfo | undefined;
  inflight: Promise<MarketInfo | undefined> | null;
};

/**
 * How long a resolved "no market" answer stays cached. A hit is stable for the
 * session, but a miss can just mean the lookup ran before the market list was
 * ready, so it expires instead of hiding Long / Short until the next reload.
 */
const MARKET_MISS_TTL_MS = 60_000;

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
    entry = {
      resolved: false,
      resolvedAt: 0,
      market: undefined,
      inflight: null,
    };
    marketCacheByKey.set(key, entry);
  } else if (
    entry.resolved &&
    !entry.market &&
    Date.now() - entry.resolvedAt > MARKET_MISS_TTL_MS
  ) {
    entry.resolved = false;
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

/**
 * Matches a wallet ticker against a market name, tolerating the HIP-3 DEX
 * prefix: the wallet asset is `TSLA` while the provider names the market
 * `xyz:TSLA`. The provider name is what the rest of the app keys off, so only
 * the comparison strips the prefix.
 *
 * @param marketName - Provider market name (e.g. 'ETH', 'xyz:TSLA')
 * @param needle - Lower-cased wallet asset symbol
 * @returns Whether the market belongs to the wallet asset
 */
function marketNameMatchesSymbol(marketName: string, needle: string): boolean {
  return (
    marketName.toLowerCase() === needle ||
    getDisplaySymbol(marketName).toLowerCase() === needle
  );
}

function findMatchingMarket(
  infos: MarketInfo[],
  symbol: string,
): MarketInfo | undefined {
  const needle = symbol.toLowerCase();
  // An exact provider-name match wins so a plain `TSLA` market is never
  // shadowed by a HIP-3 `xyz:TSLA` listed earlier in the response.
  return (
    infos.find((candidate) => candidate.name.toLowerCase() === needle) ??
    infos.find((candidate) => marketNameMatchesSymbol(candidate.name, needle))
  );
}

/**
 * Looks up the Perps market for a symbol, caching hits for the session and
 * misses for `MARKET_MISS_TTL_MS`.
 *
 * A rejected `perpsGetMarkets` call is not cached and the rejection is
 * propagated, so the caller can retry instead of committing to Buy / Swap.
 *
 * @param symbol - The wallet asset's symbol (e.g. 'ETH', 'DAI')
 * @param useTerminalApi - Whether to fetch markets from the terminal backend
 * @returns The matching market, or undefined when none exists
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
        entry.resolvedAt = Date.now();
        entry.inflight = null;
        return market;
      })
      .catch((error) => {
        entry.inflight = null;
        throw error;
      });
  }
  return entry.inflight;
}

/**
 * Runs the market lookup, retrying once when it fails. Without the retry a
 * transient `perpsGetMarkets` failure leaves the visit on Buy / Swap until the
 * user navigates away and comes back.
 *
 * @param symbol - The wallet asset's symbol (e.g. 'ETH', 'DAI')
 * @param useTerminalApi - Whether to fetch markets from the terminal backend
 * @param shouldRetry - Guard so an unmounted caller does not refetch
 * @returns The matching market, or undefined when none exists or both attempts fail
 */
async function fetchAssetPerpsMarketWithRetry(
  symbol: string,
  useTerminalApi: boolean,
  shouldRetry: () => boolean,
): Promise<MarketInfo | undefined> {
  try {
    return await fetchAssetPerpsMarket(symbol, useTerminalApi);
  } catch {
    if (!shouldRetry()) {
      return undefined;
    }
  }

  try {
    return await fetchAssetPerpsMarket(symbol, useTerminalApi);
  } catch {
    return undefined;
  }
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

    const settle = (nextMarket: MarketInfo | undefined) => {
      if (!cancelled) {
        setMarket(nextMarket);
        setIsLoading(false);
      }
    };

    fetchAssetPerpsMarketWithRetry(
      symbol,
      useTerminalApi,
      () => !cancelled,
    ).then(settle);

    return () => {
      cancelled = true;
    };
  }, [isPerpsAvailable, symbol, useTerminalApi]);

  if (!isPerpsAvailable) {
    return { market: undefined, isLoading: false };
  }

  return { market, isLoading };
}
