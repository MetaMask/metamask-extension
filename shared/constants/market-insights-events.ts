/**
 * Canonical Market Insights analytics contract from `segment-schema`:
 * `libraries/properties/metamask-market-insights-globals.yaml` and the Market
 * Insights TRACK events in `libraries/events/metamask-mobile-social/`.
 */
export const MARKET_INSIGHTS_EVENT_PROPERTY = {
  CAIP19: 'caip19',
  ASSET_SYMBOL: 'asset_symbol',
  DIGEST_ID: 'digest_id',
  SOURCE: 'source',
} as const;

export const MARKET_INSIGHTS_EVENT_VALUE = {
  SOURCE: {
    TOKEN_DETAILS: 'token_details',
    PERPS: 'perps',
    UNKNOWN: 'unknown',
  },
} as const;

export type MarketInsightsEventSource =
  (typeof MARKET_INSIGHTS_EVENT_VALUE)['SOURCE'][keyof (typeof MARKET_INSIGHTS_EVENT_VALUE)['SOURCE']];
