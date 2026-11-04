/**
 * Font-size steps shared with the Mobile Grotzec amount inputs: an 88px
 * start, stepping down to a 20px floor. Line height equals the font size.
 */
export const HERO_AMOUNT_FONT_SIZES = [88, 72, 60, 48, 40, 32, 24, 20] as const;

export type HeroAmountFontSize = (typeof HERO_AMOUNT_FONT_SIZES)[number];

export const HERO_AMOUNT_MAX_FONT_SIZE: HeroAmountFontSize = 88;

export const HERO_AMOUNT_MIN_FONT_SIZE: HeroAmountFontSize = 20;

/**
 * Content width of a full-width row in the 360px popup (16px padding on each
 * side). Used only while the row has no measured width, such as in jsdom.
 */
export const HERO_AMOUNT_FALLBACK_WIDTH = 328;

/** Widest Grotzec digit, in em. Every amount character is counted at this width. */
export const HERO_AMOUNT_DIGIT_WIDTH_EM = 0.43;

/** Font size of the offscreen prefix probe. Its width divided by this is em. */
export const HERO_AMOUNT_PREFIX_PROBE_FONT_SIZE = 100;

/** Skeleton width while the amount is loading. */
export const HERO_AMOUNT_SKELETON_WIDTH = 80;

/**
 * Whether a typed value is a partial amount: digits with at most one `.` or
 * `,` separator, and at most `maxDecimals` digits after it.
 *
 * @param value - The value the field would hold after the keystroke.
 * @param maxDecimals - Digits allowed after the separator. Unlimited if omitted.
 * @returns Whether to keep the keystroke.
 */
export function isPartialHeroAmount(
  value: string,
  maxDecimals?: number,
): boolean {
  const match = /^[0-9]*(?:[.,]([0-9]*))?$/u.exec(value);
  if (!match) {
    return false;
  }
  return maxDecimals === undefined || (match[1] ?? '').length <= maxDecimals;
}
