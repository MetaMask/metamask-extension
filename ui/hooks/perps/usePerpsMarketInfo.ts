import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import type { MarketInfo } from '@metamask/perps-controller';
import { submitRequestToBackground } from '../../store/background-connection';
import { getSelectedInternalAccount } from '../../selectors/accounts';
import {
  selectPerpsActiveProvider,
  selectPerpsIsTestnet,
} from '../../selectors/perps-controller';

type EnvCacheEntry = {
  cached: MarketInfo[] | null;
  inflight: Promise<MarketInfo[]> | null;
};

const cacheByKey = new Map<string, EnvCacheEntry>();

function getCacheEntry(cacheKey: string): EnvCacheEntry {
  let entry = cacheByKey.get(cacheKey);
  if (!entry) {
    entry = { cached: null, inflight: null };
    cacheByKey.set(cacheKey, entry);
  }
  return entry;
}

function peekCachedMarketInfos(cacheKey: string): MarketInfo[] | undefined {
  const cached = cacheByKey.get(cacheKey)?.cached;
  return cached ?? undefined;
}

function fetchMarketInfos(cacheKey: string): Promise<MarketInfo[]> {
  const entry = getCacheEntry(cacheKey);
  if (entry.cached) {
    return Promise.resolve(entry.cached);
  }
  if (!entry.inflight) {
    entry.inflight = submitRequestToBackground<MarketInfo[]>(
      'perpsGetMarkets',
      [{}],
    )
      .then((infos) => {
        entry.cached = infos;
        entry.inflight = null;
        return infos;
      })
      .catch(() => {
        entry.inflight = null;
        return [] as MarketInfo[];
      });
  }
  return entry.inflight;
}

/**
 * Clears all module-level `MarketInfo` cache entries and drops in-flight
 * requests (callers hold their own `EnvCacheEntry` references; stale resolves
 * write only to orphaned entries). Invoked when the Perps stream layer resets
 * (account switch, `clearAllCaches`, etc.) so UI never reads cross-account or
 * cross-session stale metadata.
 */
export function clearPerpsMarketInfoModuleCache(): void {
  cacheByKey.clear();
}

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
  const activeProvider = useSelector(selectPerpsActiveProvider);
  const isTestnet = useSelector(selectPerpsIsTestnet);
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const selectedAddress = selectedAccount?.address;

  const marketInfoCacheKey = useMemo(() => {
    const net = isTestnet ? 'testnet' : 'mainnet';
    const addressKey = (selectedAddress ?? '').toLowerCase();
    return `${activeProvider}:${net}:${addressKey}`;
  }, [activeProvider, isTestnet, selectedAddress]);

  const [marketInfos, setMarketInfos] = useState<MarketInfo[]>(
    () => peekCachedMarketInfos(marketInfoCacheKey) ?? [],
  );

  useEffect(() => {
    let cancelled = false;

    const cached = peekCachedMarketInfos(marketInfoCacheKey);
    if (cached) {
      setMarketInfos(cached);
    } else {
      setMarketInfos([]);
    }

    fetchMarketInfos(marketInfoCacheKey).then((infos) => {
      if (!cancelled) {
        setMarketInfos(infos);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [marketInfoCacheKey]);

  return marketInfos.find((m) => m.name.toLowerCase() === symbol.toLowerCase());
}
