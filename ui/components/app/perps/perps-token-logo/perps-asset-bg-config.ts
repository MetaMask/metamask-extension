/**
 * Asset Background Configuration
 *
 * Some token logos have poor visibility in certain themes due to their design:
 * - Dark logos on transparent backgrounds become invisible in dark mode
 * - Light logos on transparent backgrounds become invisible in light mode
 *
 * This configuration ensures optimal visibility by applying contrasting backgrounds
 * when needed, while maintaining performance with O(1) Set lookups.
 *
 * Source of truth lives in mobile at
 * `app/components/UI/Perps/components/PerpsTokenLogo/PerpsAssetBgConfig.ts`.
 * Keep both lists in sync when assets are added on either platform.
 */

// Assets with dark logos that need light backgrounds in dark mode for visibility
export const ASSETS_REQUIRING_LIGHT_BG = new Set<string>([
  'ETH',
  'XRP',
  'FARTCOIN',
  'ADA',
  'WLD',
  'NEAR',
  'ONDO',
  'XLM',
  'RESOLV',
  'CFX',
  'DYM',
  'USUAL',
  'BIGTIME',
  'GALA',
  'AR',
  'UNI',
  'ETHFI',
]);

// Assets with light logos that need dark backgrounds in light mode for visibility
export const ASSETS_REQUIRING_DARK_BG = new Set<string>([
  'S',
  'RESOLV',
  'IO',
  'USUAL',
  'SOPH',
  'SAGA',
  'XPL',
]);
