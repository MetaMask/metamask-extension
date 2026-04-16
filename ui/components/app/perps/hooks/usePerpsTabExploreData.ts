import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { PerpsMarketData } from '@metamask/perps-controller';
import {
  usePerpsLiveMarketData,
  usePerpsLivePrices,
} from '../../../../hooks/perps/stream';
import {
  selectPerpsIsTestnet,
  selectPerpsWatchlistMarkets,
} from '../../../../selectors/perps-controller';
import { PERPS_CONSTANTS } from '../constants';

const DEFAULT_REFRESH_INTERVAL_MS = 30000;

export type UsePerpsTabExploreDataOptions = {
  refreshIntervalMs?: number;
};

export type UsePerpsTabExploreDataReturn = {
  exploreMarkets: PerpsMarketData[];
  watchlistMarkets: PerpsMarketData[];
  isInitialLoading: boolean;
};

export function usePerpsTabExploreData(
  options: UsePerpsTabExploreDataOptions = {},
): UsePerpsTabExploreDataReturn {
  const { refreshIntervalMs = DEFAULT_REFRESH_INTERVAL_MS } = options;
  const { markets, isInitialLoading, refresh } = usePerpsLiveMarketData();
  const watchlistMarketsState = useSelector(selectPerpsWatchlistMarkets);
  const isTestnet = useSelector(selectPerpsIsTestnet);
  const watchlistSymbols = isTestnet
    ? watchlistMarketsState.testnet
    : watchlistMarketsState.mainnet;

  const marketSymbols = useMemo(
    () =>
      Array.from(new Set(markets.map((market) => market.symbol))).sort(
        (left, right) => left.localeCompare(right),
      ),
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

  const watchlistSymbolSet = useMemo(
    () => new Set(watchlistSymbols.map((symbol) => symbol.toUpperCase())),
    [watchlistSymbols],
  );

  const exploreMarkets = useMemo(
    () => liveMarkets.slice(0, PERPS_CONSTANTS.EXPLORE_MARKETS_LIMIT),
    [liveMarkets],
  );

  const filteredWatchlistMarkets = useMemo(
    () =>
      liveMarkets.filter((market) =>
        watchlistSymbolSet.has(market.symbol.toUpperCase()),
      ),
    [liveMarkets, watchlistSymbolSet],
  );

  return {
    exploreMarkets,
    watchlistMarkets: filteredWatchlistMarkets,
    isInitialLoading,
  };
}
