import {
  MARKET_CATEGORIES,
  type MarketTypeFilter,
} from '@metamask/perps-controller';

/**
 * Fallback fee rates used when the perpsCalculateFees RPC call fails or times
 * out. Values match HyperLiquid's base taker rate (0.00045) plus MetaMask
 * builder fee (0.001).
 */
export const PERPS_FALLBACK_FEE_RATES = {
  feeRate: 0.00145,
  protocolFeeRate: 0.00045,
  metamaskFeeRate: 0.001,
} as const;

/**
 * i18n keys referenced from Perps tests via `enLocale`. Quoted literals are picked
 * up by `yarn verify-locales` (development/verify-locale-strings.js).
 */
export const PERPS_TEST_EN_LOCALE_KEYS = {
  depositErrorBridgeFailed: 'perpsDepositErrorBridgeFailed',
  transactionTitleOpenedLong: 'perpsTransactionTitleOpenedLong',
} as const;

/** Max items shown in the Perps tab Recent Activity preview (matches Activity page slice). */
export const PERPS_RECENT_ACTIVITY_MAX_TRANSACTIONS = 5;

// Market categories are owned by the controller (v8 `MARKET_CATEGORIES`); the UI
// only adds the `all` and `new` pseudo-filters, so a new core category does not
// require a change here.
export const VALID_MARKET_FILTERS = [
  'all',
  ...MARKET_CATEGORIES,
  'new',
] as const satisfies readonly MarketTypeFilter[];

export type MarketFilter = (typeof VALID_MARKET_FILTERS)[number];

export const LEGACY_MARKET_FILTER_ALIASES = {
  stocks: 'stock',
  commodities: 'commodity',
} as const satisfies Record<string, MarketFilter>;

export function normalizeMarketFilter(filter: string): MarketFilter | null {
  const canonicalFilter =
    LEGACY_MARKET_FILTER_ALIASES[
      filter as keyof typeof LEGACY_MARKET_FILTER_ALIASES
    ] ?? filter;

  if (VALID_MARKET_FILTERS.includes(canonicalFilter as MarketFilter)) {
    return canonicalFilter as MarketFilter;
  }

  return null;
}

/**
 * Contact support (Help Center). Single source of truth aligned with mobile perpsConfig.
 */
export const SUPPORT_CONFIG = {
  Url: 'https://support.metamask.io/?utm_source=extension',
} as const;

/**
 * Perps feedback survey (third-party). Single source of truth aligned with mobile perpsConfig.
 */
export const FEEDBACK_CONFIG = {
  Url: 'https://survey.alchemer.com/s3/8649911/MetaMask-Perps-Trading-Feedback',
} as const;

/**
 * Perps support article URLs. Aligned with mobile perpsConfig.
 */
export const PERPS_SUPPORT_ARTICLES_URLS = {
  AdlUrl:
    'https://support.metamask.io/manage-crypto/trade/perps/leverage-and-liquidation/?utm_source=extension#what-is-auto-deleveraging-adl',
} as const;
