import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { PerpsMarketData } from '@metamask/perps-controller';
import { usePerpsLiveMarketListData } from '../../../../hooks/perps/stream';
import {
  selectPerpsIsTestnet,
  selectPerpsWatchlistMarkets,
} from '../../../../selectors/perps-controller';
import { PERPS_CONSTANTS } from '../constants';

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
  const { refreshIntervalMs } = options;
  const { markets: liveMarkets, isInitialLoading } = usePerpsLiveMarketListData(
    { refreshIntervalMs },
  );
  const watchlistMarketsState = useSelector(selectPerpsWatchlistMarkets);
  const isTestnet = useSelector(selectPerpsIsTestnet);
  const watchlistSymbols = isTestnet
    ? watchlistMarketsState.testnet
    : watchlistMarketsState.mainnet;

  const liveMarketMap = useMemo(
    () =>
      new Map(
        liveMarkets.map((market) => [market.symbol.toUpperCase(), market]),
      ),
    [liveMarkets],
  );

  const exploreMarkets = useMemo(
    () => liveMarkets.slice(0, PERPS_CONSTANTS.EXPLORE_MARKETS_LIMIT),
    [liveMarkets],
  );

  const filteredWatchlistMarkets = useMemo(
    () =>
      watchlistSymbols
        .map((symbol) => liveMarketMap.get(symbol.toUpperCase()))
        .filter((market): market is PerpsMarketData => Boolean(market)),
    [liveMarketMap, watchlistSymbols],
  );

  return {
    exploreMarkets,
    watchlistMarkets: filteredWatchlistMarkets,
    isInitialLoading,
  };
}
