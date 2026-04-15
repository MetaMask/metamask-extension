import { useEffect, useMemo } from 'react';
import type { PerpsMarketData } from '@metamask/perps-controller';
import {
  usePerpsLiveMarketData,
  type UsePerpsLiveMarketDataReturn,
} from './usePerpsLiveMarketData';
import { usePerpsLivePrices } from './usePerpsLivePrices';

const DEFAULT_REFRESH_INTERVAL_MS = 30000;

export type UsePerpsLiveMarketListDataOptions = {
  refreshIntervalMs?: number;
};

export type UsePerpsLiveMarketListDataReturn = Pick<
  UsePerpsLiveMarketDataReturn,
  'cryptoMarkets' | 'hip3Markets' | 'isInitialLoading' | 'error' | 'refresh'
> & {
  markets: PerpsMarketData[];
};

export function usePerpsLiveMarketListData(
  options: UsePerpsLiveMarketListDataOptions = {},
): UsePerpsLiveMarketListDataReturn {
  const { refreshIntervalMs = DEFAULT_REFRESH_INTERVAL_MS } = options;
  const {
    markets,
    cryptoMarkets,
    hip3Markets,
    isInitialLoading,
    error,
    refresh,
  } = usePerpsLiveMarketData();

  const marketSymbols = useMemo(
    () => Array.from(new Set(markets.map((market) => market.symbol))).sort(),
    [markets],
  );
  const marketSymbolsKey = useMemo(
    () => marketSymbols.join('|'),
    [marketSymbols],
  );

  const { prices } = usePerpsLivePrices({
    symbols: marketSymbols,
    activateStream: true,
    includeMarketData: false,
  });

  useEffect(() => {
    if (!marketSymbolsKey) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      refresh();
    }, refreshIntervalMs);

    return () => window.clearInterval(intervalId);
  }, [marketSymbolsKey, refresh, refreshIntervalMs]);

  const liveMarkets = useMemo(() => {
    if (Object.keys(prices).length === 0) {
      return markets;
    }

    return markets.map((market) => {
      const liveUpdate = prices[market.symbol];
      if (!liveUpdate) {
        return market;
      }

      return {
        ...market,
        price: liveUpdate.price ?? market.price,
        change24hPercent:
          liveUpdate.percentChange24h ?? market.change24hPercent,
      };
    });
  }, [markets, prices]);

  const liveMarketMap = useMemo(
    () => new Map(liveMarkets.map((market) => [market.symbol, market])),
    [liveMarkets],
  );

  return {
    markets: liveMarkets,
    cryptoMarkets: cryptoMarkets.map(
      (market) => liveMarketMap.get(market.symbol) ?? market,
    ),
    hip3Markets: hip3Markets.map(
      (market) => liveMarketMap.get(market.symbol) ?? market,
    ),
    isInitialLoading,
    error,
    refresh,
  };
}
