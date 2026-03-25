export const VALID_MARKET_FILTERS = [
  'all',
  'crypto',
  'stocks',
  'commodities',
  'forex',
  'new',
] as const;

export type MarketFilter = (typeof VALID_MARKET_FILTERS)[number];
