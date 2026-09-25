/**
 * Ambient chart theming configuration.
 *
 * Ports mobile's ambient price-color A/B test to extension.
 * Colors chart candles/line based on price direction:
 * - Bullish (up): custom green
 * - Bearish (down): amber/orange (`brandColor.orange400`)
 *
 * Mobile reference: `abTestConfig.ts` + `Price.advanced.tsx`
 */

import { brandColor } from '@metamask/design-tokens';

/**
 * Amber/orange color for bearish (price decrease) direction.
 * Matches mobile's `AMBIENT_NEGATIVE_COLOR` from `abTestConfig.ts`.
 * Maps to `brandColor.orange400` in the design system.
 */
export const AMBIENT_NEGATIVE_COLOR = brandColor.orange400;

/**
 * Custom green for bullish direction in light mode.
 * Matches mobile's `LIGHT_MODE_SUCCESS_GREEN` from `util/theme/index.ts`.
 * Not available in the design system — mobile-specific value for chart contrast.
 */
// eslint-disable-next-line @metamask/design-tokens/color-no-hex
export const LIGHT_MODE_SUCCESS_GREEN = '#00881A';

/**
 * Design-system lime/success green for bullish direction in dark mode.
 * Matches mobile's `theme.colors.success.default` (dark) → `brandColor.lime100`.
 */
export const DARK_MODE_SUCCESS_GREEN = brandColor.lime100;

/**
 * Returns the ambient chart color based on price direction and theme.
 *
 * @param isPositive - Whether the price movement is positive (up)
 * @param isDark - Whether the current theme is dark mode
 * @returns The hex color string for the ambient direction
 */
export function getAmbientColor(isPositive: boolean, isDark: boolean): string {
  if (isPositive) {
    return isDark ? DARK_MODE_SUCCESS_GREEN : LIGHT_MODE_SUCCESS_GREEN;
  }
  return AMBIENT_NEGATIVE_COLOR;
}

/**
 * Returns the success (bullish) color for the current theme.
 * Used as `successColorOverride` for candle up-color.
 *
 * @param isDark - Whether the current theme is dark mode
 * @returns The hex color string for bullish candles
 */
export function getAmbientSuccessColor(isDark: boolean): string {
  return isDark ? DARK_MODE_SUCCESS_GREEN : LIGHT_MODE_SUCCESS_GREEN;
}
