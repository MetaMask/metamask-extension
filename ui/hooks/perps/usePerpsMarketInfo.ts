import { useEffect, useState } from 'react';
import type { MarketInfo } from '@metamask/perps-controller';
import { submitRequestToBackground } from '../../store/background-connection';

let cachedMarketInfos: MarketInfo[] | null = null;
let inflight: Promise<MarketInfo[]> | null = null;

function fetchMarketInfos(): Promise<MarketInfo[]> {
  if (cachedMarketInfos) {
    return Promise.resolve(cachedMarketInfos);
  }
  if (!inflight) {
    inflight = submitRequestToBackground<MarketInfo[]>('perpsGetMarkets', [{}])
      .then((infos) => {
        cachedMarketInfos = infos;
        inflight = null;
        return infos;
      })
      .catch(() => {
        inflight = null;
        return [] as MarketInfo[];
      });
  }
  return inflight;
}

/**
 * Fetches the full MarketInfo for a specific asset symbol.
 *
 * MarketInfo includes fields not present in the streaming PerpsMarketData
 * (e.g. szDecimals, maxLeverage as a number, marginTableId), which are
 * required for accurate pre-trade calculations that mirror the mobile app.
 *
 * The market list is fetched once and cached at module level so that
 * navigating between detail pages does not trigger additional REST calls.
 * Until the fetch resolves the hook returns `undefined`, and callers
 * should fall back to safe defaults (e.g. szDecimals = 0).
 *
 * @param symbol - Asset symbol to look up (e.g. 'HYPE', 'BTC', 'xyz:TSLA')
 * @returns The matching MarketInfo, or undefined while loading / on error
 */
export function usePerpsMarketInfo(symbol: string): MarketInfo | undefined {
  const [marketInfos, setMarketInfos] = useState<MarketInfo[]>(
    cachedMarketInfos ?? [],
  );

  useEffect(() => {
    let cancelled = false;

    fetchMarketInfos().then((infos) => {
      if (!cancelled) {
        setMarketInfos(infos);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return marketInfos.find((m) => m.name.toLowerCase() === symbol.toLowerCase());
}
