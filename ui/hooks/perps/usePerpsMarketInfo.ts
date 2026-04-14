import { useEffect, useState } from 'react';
import type { MarketInfo } from '@metamask/perps-controller';
import { submitRequestToBackground } from '../../store/background-connection';

/**
 * Fetches the full MarketInfo for a specific asset symbol.
 *
 * MarketInfo includes fields not present in the streaming PerpsMarketData
 * (e.g. szDecimals, maxLeverage as a number, marginTableId), which are
 * required for accurate pre-trade calculations that mirror the mobile app.
 *
 * The market list is fetched once on mount and cached in component state;
 * the underlying provider already caches the data, so subsequent renders
 * are free.  Until the fetch resolves the hook returns `undefined`, and
 * callers should fall back to safe defaults (e.g. szDecimals = 0).
 *
 * @param symbol - Asset symbol to look up (e.g. 'HYPE', 'BTC', 'xyz:TSLA')
 * @returns The matching MarketInfo, or undefined while loading / on error
 */
export function usePerpsMarketInfo(symbol: string): MarketInfo | undefined {
  const [marketInfos, setMarketInfos] = useState<MarketInfo[]>([]);

  useEffect(() => {
    let cancelled = false;

    submitRequestToBackground<MarketInfo[]>('perpsGetMarkets', [{}])
      .then((infos) => {
        if (!cancelled) {
          setMarketInfos(infos);
        }
      })
      .catch(() => {
        // Silently fall back – callers use safe defaults when undefined
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return marketInfos.find((m) => m.name.toLowerCase() === symbol.toLowerCase());
}
