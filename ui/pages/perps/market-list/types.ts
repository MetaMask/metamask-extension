import type { PerpsMarketData } from '../../../components/app/perps/types';

/**
 * Market category filter types
 * - null: No filter applied, show all markets
 * - 'crypto': Show only cryptocurrency markets
 * - 'stocks': Show only equity/stock markets
 * - 'commodities': Show only commodity markets
 * - 'forex': Show only forex markets
 */
export type CategoryFilter = 'crypto' | 'stocks' | 'commodities' | 'forex';

/**
 * Full market filter including watchlist
 * - null: No filter applied, show all markets
 * - 'watchlist': Show only watchlisted markets
 * - CategoryFilter: Filter by specific category
 */
export type MarketFilter = 'watchlist' | CategoryFilter | null;

/**
 * Map UI filter names to market type values in PerpsMarketData
 */
const CATEGORY_TO_MARKET_TYPE: Record<
  CategoryFilter,
  (market: PerpsMarketData) => boolean
> = {
  crypto: (m) => !m.marketType || m.marketType === 'crypto',
  stocks: (m) => m.marketType === 'equity',
  commodities: (m) => m.marketType === 'commodity',
  forex: (m) => m.marketType === 'forex',
};

/**
 * Filter markets by market type or watchlist
 *
 * @param markets - Array of markets to filter
 * @param filter - Market type filter or 'watchlist'
 * @param watchlist - Array of watched market symbols (used when filter is 'watchlist')
 * @returns Filtered array of markets
 */
export const filterMarketsByType = (
  markets: PerpsMarketData[],
  filter: MarketFilter,
  watchlist: string[] = [],
): PerpsMarketData[] => {
  // No filter = show all
  if (filter === null) {
    return markets;
  }

  // Watchlist filter
  if (filter === 'watchlist') {
    return markets.filter((m) => watchlist.includes(m.symbol));
  }

  // Category filter
  const filterFn = CATEGORY_TO_MARKET_TYPE[filter];
  return markets.filter(filterFn);
};
