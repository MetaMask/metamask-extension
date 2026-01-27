/**
 * Perps constants
 *
 * Constants used across the Perps trading feature.
 * These may eventually be moved to core.
 */

/**
 * HyperLiquid asset icons base URL
 * Used to fetch asset icons for perps trading pairs
 */
export const HYPERLIQUID_ASSET_ICONS_BASE_URL =
  'https://app.hyperliquid.xyz/coins/';

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
} as const;

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
