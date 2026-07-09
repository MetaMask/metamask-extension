/**
 * Perps constants
 *
 * Constants used across the Perps trading feature.
 * These may eventually be moved to core.
 */

/**
 * Height of list item rows (positions, orders, markets, transactions).
 * Matches ASSET_CELL_HEIGHT from the tokens tab for visual consistency.
 */
export const PERPS_LIST_ITEM_HEIGHT = 62;

/**
 * HyperLiquid asset icons base URL
 * Used to fetch asset icons for perps trading pairs
 */
export const HYPERLIQUID_ASSET_ICONS_BASE_URL =
  'https://app.hyperliquid.xyz/coins/';

/**
 * MetaMask-hosted perps icons base URL (GitHub/contract-metadata)
 * Primary source for asset icons; covers HIP-3 assets missing from HyperLiquid CDN
 */
export const METAMASK_PERPS_ICONS_BASE_URL =
  'https://raw.githubusercontent.com/MetaMask/contract-metadata/master/icons/eip155:999/';

/**
 * Perps withdraw amount input: digits with optional decimal, max six fractional digits
 * (aligned with HyperLiquid / controller expectations).
 */
export const PERPS_WITHDRAW_AMOUNT_REGEX = /^\d*\.?\d{0,6}$/u;

export const isValidPerpsWithdrawAmount = (amount: string): boolean =>
  PERPS_WITHDRAW_AMOUNT_REGEX.test(amount);

/**
 * General perps display constants
 * Fallback values for when data is unavailable or invalid
 */
export const PERPS_CONSTANTS = {
  // Fallback display values
  FALLBACK_PRICE_DISPLAY: '--',
  FALLBACK_DATA_DISPLAY: '--',
  ZERO_AMOUNT_DISPLAY: '$0',
  ZERO_AMOUNT_DETAILED_DISPLAY: '$0.00',

  RECENT_ACTIVITY_LIMIT: 3,
  FILLS_LOOKBACK_MS: 90 * 24 * 60 * 60 * 1000, // 3 months in milliseconds

  /** Max markets shown in the explore section (aligned with mobile). */
  EXPLORE_MARKETS_LIMIT: 8,
} as const;

/**
 * Collateral asset used to settle perps positions. Shown in market pair labels
 * such as "BTC-USDC perp".
 */
export const PERPS_COLLATERAL_SYMBOL = 'USDC';

/**
 * Minimum USD notional for market / reduce-only orders on HyperLiquid (mainnet and testnet).
 * Partial closes below this amount fail with ORDER_SIZE_MIN; full closes omit this check.
 * Duplicates TRADING_DEFAULTS.amount in @metamask/perps-controller until a shared export exists.
 * @see TRADING_DEFAULTS.amount in @metamask/perps-controller hyperLiquidConfig
 */
export const PERPS_MIN_MARKET_ORDER_USD = 10;

/**
 * Market sorting configuration
 * Controls sorting behavior for the markets view
 */
export const MARKET_SORTING_CONFIG = {
  // Default sort direction
  DEFAULT_DIRECTION: 'desc' as const,

  // Available sort fields (only includes fields supported by PerpsMarketData)
  SORT_FIELDS: {
    VOLUME: 'volume',
    PRICE_CHANGE: 'priceChange',
    OPEN_INTEREST: 'openInterest',
    FUNDING_RATE: 'fundingRate',
  } as const,
} as const;

/**
 * HIP-3 market configuration
 *
 * HIP-3 markets are non-crypto assets (stock, pre-IPO, index, ETF,
 * commodity, forex) available
 * through partner DEX integrations. Each source identifier corresponds to a
 * specific DEX provider.
 *
 * The list of supported sources is controlled by the `perpsHip3AllowlistMarkets`
 * feature flag. Use the `getHip3AllowedSourcesSet` selector to get the current
 * allowed sources, or the `useHip3MarketFilter` hook for filtering utilities.
 *
 * @see ui/selectors/perps/feature-flags.ts for the selector
 * @see ui/hooks/perps/useHip3MarketFilter.ts for the hook
 */
export const HIP3_MARKET_CONFIG = {
  /**
   * Check if a market source is in the allowed HIP-3 sources
   *
   * @param marketSource - The market source identifier to check
   * @param allowedSources - Set of allowed source identifiers from the feature flag
   * @returns True if the source is an allowed HIP-3 provider
   */
  isAllowedSource: (
    marketSource: string | undefined,
    allowedSources: Set<string>,
  ): boolean => {
    return Boolean(marketSource && allowedSources.has(marketSource));
  },
} as const;
