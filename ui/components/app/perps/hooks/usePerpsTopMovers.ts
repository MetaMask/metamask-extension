import { useMemo } from 'react';
import {
  sortMarkets,
  type SortDirection,
} from '../../../../pages/perps/utils/sortMarkets';
import { MARKET_SORTING_CONFIG, PERPS_CONSTANTS } from '../constants';
import type { PerpsMarketData } from '../types';

export type UsePerpsTopMoversOptions = {
  /** Live markets to rank, supplied by the Perps tab's market-list stream owner. */
  markets: PerpsMarketData[];
  /** `desc` ranks the biggest risers (gainers), `asc` the biggest fallers (losers). */
  direction: SortDirection;
};

/**
 * Ranks the supplied perps markets by 24h price change and returns the top
 * `PERPS_CONSTANTS.TOP_MOVERS_LIMIT` in the requested direction.
 *
 * Deliberately takes markets as an argument rather than reading the stream
 * itself. The background `prices` channel is a single shared stream whose
 * `perpsDeactivatePriceStream` teardown is global and not ref-counted, so it
 * assumes one active owner; on the Perps tab that owner is
 * `usePerpsTabExploreData`. Subscribing again here would add a second 30s
 * refresh interval and let either consumer's unmount tear the stream down for
 * the whole tab.
 *
 * @param options - Hook options.
 * @param options.markets - Live markets to rank.
 * @param options.direction - Ranking direction: `desc` for gainers, `asc` for losers.
 * @returns The ranked markets, capped at the Top movers limit.
 */
export function usePerpsTopMovers({
  markets,
  direction,
}: UsePerpsTopMoversOptions): PerpsMarketData[] {
  return useMemo(
    () =>
      sortMarkets({
        markets,
        sortBy: MARKET_SORTING_CONFIG.SORT_FIELDS.PRICE_CHANGE,
        direction,
      }).slice(0, PERPS_CONSTANTS.TOP_MOVERS_LIMIT),
    [markets, direction],
  );
}
