import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import type { MarketInfo } from '@metamask/perps-controller';
import { submitRequestToBackground } from '../../store/background-connection';
import {
  selectPerpsActiveProvider,
  selectPerpsIsTestnet,
} from '../../selectors/perps-controller';

type EnvCacheEntry = {
  cached: MarketInfo[] | null;
  inflight: Promise<MarketInfo[]> | null;
};

const cacheByEnvKey = new Map<string, EnvCacheEntry>();

function getEnvCacheEntry(envKey: string): EnvCacheEntry {
  let entry = cacheByEnvKey.get(envKey);
  if (!entry) {
    entry = { cached: null, inflight: null };
    cacheByEnvKey.set(envKey, entry);
  }
  return entry;
}

function peekCachedMarketInfos(envKey: string): MarketInfo[] | undefined {
  const cached = cacheByEnvKey.get(envKey)?.cached;
  return cached ?? undefined;
}

function fetchMarketInfos(envKey: string): Promise<MarketInfo[]> {
  const entry = getEnvCacheEntry(envKey);
  if (entry.cached) {
    return Promise.resolve(entry.cached);
  }
  if (!entry.inflight) {
    entry.inflight = submitRequestToBackground<MarketInfo[]>('perpsGetMarkets', [{}])
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
 * Clears the module-level market info cache. Intended for unit tests only.
 */
export function resetPerpsMarketInfoModuleCacheForTesting(): void {
  cacheByEnvKey.clear();
}

/**
 * Fetches the full MarketInfo for a specific asset symbol.
 *
 * MarketInfo includes fields not present in the streaming PerpsMarketData
 * (e.g. szDecimals, maxLeverage as a number, marginTableId), which are
 * required for accurate pre-trade calculations that mirror the mobile app.
 *
 * The market list is fetched once per Perps environment (active provider +
 * mainnet/testnet) and cached at module level so navigating between detail
 * pages does not trigger additional REST calls for the same environment.
 * Until the fetch resolves the hook returns `undefined`, and callers should
 * fall back to safe defaults (e.g. szDecimals = 0).
 *
 * @param symbol - Asset symbol to look up (e.g. 'HYPE', 'BTC', 'xyz:TSLA')
 * @returns The matching MarketInfo, or undefined while loading / on error
 */
export function usePerpsMarketInfo(symbol: string): MarketInfo | undefined {
  const activeProvider = useSelector(selectPerpsActiveProvider);
  const isTestnet = useSelector(selectPerpsIsTestnet);
  const envKey = useMemo(
    () => `${activeProvider}:${isTestnet ? 'testnet' : 'mainnet'}`,
    [activeProvider, isTestnet],
  );

  const [marketInfos, setMarketInfos] = useState<MarketInfo[]>(
    () => peekCachedMarketInfos(envKey) ?? [],
  );

  useEffect(() => {
    let cancelled = false;

    const cached = peekCachedMarketInfos(envKey);
    if (cached) {
      setMarketInfos(cached);
    } else {
      setMarketInfos([]);
    }

    fetchMarketInfos(envKey).then((infos) => {
      if (!cancelled) {
        setMarketInfos(infos);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [envKey]);

  return marketInfos.find((m) => m.name.toLowerCase() === symbol.toLowerCase());
}
