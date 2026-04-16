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
