/**
 * Font-size steps shared with the Mobile Grotzec amount inputs: an 88px
 * start, stepping down to a 20px floor. Line height equals the font size.
 *
 * The six smaller steps are design-token font sizes (`--font-size-base` is
 * 16px). 88 and 72 are not tokens. `TextVariant.AmountDisplayLg` only covers
 * 48px (`--font-size-9`) and, at the `md` breakpoint, 60px (`--font-size-10`),
 * so the chosen step is applied as an inline font size.
 *
 * | px | Token            |
 * | -- | ---------------- |
 * | 88 | none             |
 * | 72 | none             |
 * | 60 | `--font-size-10` |
 * | 48 | `--font-size-9`  |
 * | 40 | `--font-size-8`  |
 * | 32 | `--font-size-7`  |
 * | 24 | `--font-size-6`  |
 * | 20 | `--font-size-5`  |
 *
 * Token line heights are taller than these sizes (60px type uses a 75px line
 * height). This scale keeps line height equal to the font size so the row
 * stays one height. A later change can point the six token sizes at
 * `var(--font-size-*)` once 88 and 72 have a home in the design system.
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
  const match = /^\d*(?:[.,](\d*))?$/u.exec(value);
  if (!match) {
    return false;
  }
  return maxDecimals === undefined || (match[1] ?? '').length <= maxDecimals;
}
