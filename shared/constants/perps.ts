/** Max items shown in the Perps tab Recent Activity preview (matches Activity page slice). */
export const PERPS_RECENT_ACTIVITY_MAX_TRANSACTIONS = 5;

export const VALID_MARKET_FILTERS = [
  'all',
  'crypto',
  'stocks',
  'commodities',
  'forex',
  'new',
] as const;

export type MarketFilter = (typeof VALID_MARKET_FILTERS)[number];
