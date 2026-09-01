import { useMemo } from 'react';
import { usePerpsLiveMarketListData } from '../../../../hooks/perps/stream';
import {
  sortMarkets,
  type SortDirection,
} from '../../../../pages/perps/utils/sortMarkets';
import { MARKET_SORTING_CONFIG, PERPS_CONSTANTS } from '../constants';
import type { PerpsMarketData } from '../types';

export type UsePerpsTopMoversOptions = {
  /** `desc` ranks the biggest risers (gainers), `asc` the biggest fallers (losers). */
  direction: SortDirection;
};

export type UsePerpsTopMoversReturn = {
  markets: PerpsMarketData[];
  isInitialLoading: boolean;
};

/**
 * Ranks the live perps markets by 24h price change and returns the top
 * `PERPS_CONSTANTS.TOP_MOVERS_LIMIT` in the requested direction.
 *
 * Reads the same market-list stream channel the Perps tab's Explore section
 * uses, so switching direction only re-derives an existing snapshot — no
 * refetch, and no extra subscription. Mobile's `usePerpsTopMovers` additionally
 * merges `usePerpsLivePrices` ticks because its base markets come from a REST
 * snapshot; the extension's stream already pushes updated `change24hPercent`,
 * so that merge would add an all-symbol subscription for no gain.
 *
 * @param options - Hook options.
 * @param options.direction - Ranking direction: `desc` for gainers, `asc` for losers.
 * @returns The ranked markets and whether the first market snapshot is still loading.
 */
export function usePerpsTopMovers({
  direction,
}: UsePerpsTopMoversOptions): UsePerpsTopMoversReturn {
  const { markets: liveMarkets, isInitialLoading } =
    usePerpsLiveMarketListData();

  const markets = useMemo(
    () =>
      sortMarkets({
        markets: liveMarkets,
        sortBy: MARKET_SORTING_CONFIG.SORT_FIELDS.PRICE_CHANGE,
        direction,
      }).slice(0, PERPS_CONSTANTS.TOP_MOVERS_LIMIT),
    [liveMarkets, direction],
  );

  return { markets, isInitialLoading };
}
