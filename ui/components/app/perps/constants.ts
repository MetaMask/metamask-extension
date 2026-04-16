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

/**
 * HIP-3 market configuration
 *
 * HIP-3 markets are non-crypto assets (stocks, commodities, forex) available
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

/**
 * HIP-3 market type for asset classification
 */
export type Hip3MarketType = 'equity' | 'commodity' | 'forex';

/**
 * HIP-3 asset market type classifications (PRODUCTION DEFAULT)
 *
 * This is the production default configuration, can be overridden via feature flag
 * (remoteFeatureFlags.perpsAssetMarketTypes) for dynamic control.
 *
 * Maps asset symbols (e.g., "xyz:TSLA") to their market type for badge display.
 *
 * Market type determines the badge shown in the UI:
 * - 'equity': STOCK badge (stocks like TSLA, NVDA)
 * - 'commodity': COMMODITY badge (commodities like GOLD)
 * - 'forex': FOREX badge (forex pairs)
 * - undefined: No badge for crypto or unmapped assets
 *
 * Format: 'dex:SYMBOL' → MarketType
 * This allows flexible per-asset classification.
 * Assets not listed here will have no market type (undefined).
 */
export const HIP3_ASSET_MARKET_TYPES: Record<string, Hip3MarketType> = {
  // xyz DEX - Equities
  'xyz:TSLA': 'equity',
  'xyz:NVDA': 'equity',
  'xyz:XYZ100': 'equity',
  'xyz:INTC': 'equity',
  'xyz:MU': 'equity',
  'xyz:CRCL': 'equity',
  'xyz:HOOD': 'equity',
  'xyz:SNDK': 'equity',
  'xyz:GOOGL': 'equity',
  'xyz:COIN': 'equity',
  'xyz:ORCL': 'equity',
  'xyz:AMZN': 'equity',
  'xyz:PLTR': 'equity',
  'xyz:AAPL': 'equity',
  'xyz:META': 'equity',
  'xyz:AMD': 'equity',
  'xyz:MSFT': 'equity',
  'xyz:BABA': 'equity',
  'xyz:RIVN': 'equity',
  'xyz:NFLX': 'equity',
  'xyz:COST': 'equity',
  'xyz:LLY': 'equity',
  'xyz:TSM': 'equity',
  'xyz:SKHX': 'equity',
  'xyz:MSTR': 'equity',
  'xyz:CRWV': 'equity',
  'xyz:SMSN': 'equity',

  // xyz DEX - Commodities
  'xyz:GOLD': 'commodity',
  'xyz:SILVER': 'commodity',
  'xyz:CL': 'commodity',
  'xyz:COPPER': 'commodity',
  'xyz:ALUMINIUM': 'commodity',
  'xyz:URANIUM': 'commodity',
  'xyz:USAR': 'commodity',
  'xyz:NATGAS': 'commodity',
  'xyz:PLATINUM': 'commodity',

  // xyz DEX - Forex
  'xyz:EUR': 'forex',
  'xyz:JPY': 'forex',
} as const;

/**
 * Get the market type for a given asset symbol.
 *
 * Looks up the symbol in HIP3_ASSET_MARKET_TYPES mapping.
 * Falls back to the market's own marketType property if not found in the mapping.
 *
 * @param symbol - The asset symbol (e.g., 'xyz:TSLA')
 * @param fallbackMarketType - Optional fallback from the market data
 * @returns The market type or undefined
 */
export const getHip3MarketType = (
  symbol: string,
  fallbackMarketType?: string,
): Hip3MarketType | undefined => {
  return (
    HIP3_ASSET_MARKET_TYPES[symbol] ?? (fallbackMarketType as Hip3MarketType)
  );
};
