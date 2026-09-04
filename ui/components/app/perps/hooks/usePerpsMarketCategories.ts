import { useMemo } from 'react';
import { MARKET_CATEGORIES } from '@metamask/perps-controller';
import type { MarketCategoryFilter } from '../../../../../shared/constants/perps';
import { marketMatchesCategory } from '../utils';
import type { PerpsMarketData } from '../types';

/**
 * The unfiltered shortcut, offered first so the rail always starts on the same
 * pill regardless of which categories the live data happens to carry.
 */
const ALL_CATEGORIES_FILTER = 'all' satisfies MarketCategoryFilter;

/**
 * Resolves the market categories worth showing on the Perps tab: the `all`
 * shortcut, followed by every controller category that at least one live market
 * falls into, in the controller's own order. A category with no live markets is
 * dropped, so a pill can never land the user on an empty market list.
 *
 * Deliberately takes markets as an argument rather than subscribing itself. The
 * background `prices` channel is a single shared stream whose
 * `perpsDeactivatePriceStream` teardown is global and not ref-counted, so it
 * assumes one active owner; on the Perps tab that owner is
 * `usePerpsTabExploreData`. Same contract as `usePerpsTopMovers`.
 *
 * @param markets - Live markets, supplied by the Perps tab's stream owner.
 * @returns The categories to render as pills, `all` first.
 */
export function usePerpsMarketCategories(
  markets: PerpsMarketData[],
): MarketCategoryFilter[] {
  return useMemo(
    () => [
      ALL_CATEGORIES_FILTER,
      ...MARKET_CATEGORIES.filter((category) =>
        markets.some((market) => marketMatchesCategory(market, category)),
      ),
    ],
    [markets],
  );
}
