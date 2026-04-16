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
    () =>
      Array.from(new Set(markets.map((market) => market.symbol))).sort(
        (left, right) => left.localeCompare(right),
      ),
    [markets],
  );
  // Use a stable key so the refresh effect only resets when the symbol set changes.
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

    const intervalId = globalThis.setInterval(() => {
      refresh();
    }, refreshIntervalMs);

    return () => globalThis.clearInterval(intervalId);
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
  const liveCryptoMarkets = useMemo(
    () =>
      cryptoMarkets.map((market) => liveMarketMap.get(market.symbol) ?? market),
    [cryptoMarkets, liveMarketMap],
  );
  const liveHip3Markets = useMemo(
    () =>
      hip3Markets.map((market) => liveMarketMap.get(market.symbol) ?? market),
    [hip3Markets, liveMarketMap],
  );

  return {
    markets: liveMarkets,
    cryptoMarkets: liveCryptoMarkets,
    hip3Markets: liveHip3Markets,
    isInitialLoading,
    error,
    refresh,
  };
}
