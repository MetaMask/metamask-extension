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
* Controls sorting behavior and presets for the trending markets view
*/
export const MARKET_SORTING_CONFIG = {
  // Default sort settings
  DEFAULT_SORT_OPTION_ID: 'volume' as const,
  DEFAULT_DIRECTION: 'desc' as const,

  // Available sort fields (only includes fields supported by PerpsMarketData)
  SORT_FIELDS: {
    VOLUME: 'volume',
    PRICE_CHANGE: 'priceChange',
    OPEN_INTEREST: 'openInterest',
    FUNDING_RATE: 'fundingRate',
  } as const,

  // Sort button presets for filter chips (simplified buttons without direction)
  SORT_BUTTON_PRESETS: [
    { field: 'volume', labelKey: 'perps.sort.volume' },
    { field: 'priceChange', labelKey: 'perps.sort.price_change' },
    { field: 'fundingRate', labelKey: 'perps.sort.funding_rate' },
  ] as const,

  // Sort options for the bottom sheet
  // Each option combines field + direction into a single selectable item
  // Only Price Change has both directions as separate options
  SORT_OPTIONS: [
    {
      id: 'volume',
      labelKey: 'perps.sort.volume',
      field: 'volume',
      direction: 'desc',
    },
    {
      id: 'priceChange-desc',
      labelKey: 'perps.sort.price_change_high_to_low',
      field: 'priceChange',
      direction: 'desc',
    },
    {
      id: 'priceChange-asc',
      labelKey: 'perps.sort.price_change_low_to_high',
      field: 'priceChange',
      direction: 'asc',
    },
    {
      id: 'openInterest',
      labelKey: 'perps.sort.open_interest',
      field: 'openInterest',
      direction: 'desc',
    },
    {
      id: 'fundingRate',
      labelKey: 'perps.sort.funding_rate',
      field: 'fundingRate',
      direction: 'desc',
    },
  ] as const,
} as const;

/**
 * Type for valid sort option IDs
 * Derived from SORT_OPTIONS to ensure type safety
 * Valid values: 'volume' | 'priceChange-desc' | 'priceChange-asc' | 'openInterest' | 'fundingRate'
 */
export type SortOptionId =
  (typeof MARKET_SORTING_CONFIG.SORT_OPTIONS)[number]['id'];

/**
 * Type for sort button presets (filter chips)
 * Derived from SORT_BUTTON_PRESETS to ensure type safety
 */
export type SortButtonPreset =
  (typeof MARKET_SORTING_CONFIG.SORT_BUTTON_PRESETS)[number];
