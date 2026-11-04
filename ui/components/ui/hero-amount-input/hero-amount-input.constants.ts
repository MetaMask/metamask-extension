/** Digits with at most one decimal separator. Letters are rejected. */
export const HERO_AMOUNT_INPUT_PATTERN = /^[0-9]*[.,]?[0-9]*$/u;

/**
 * Whether a typed amount can be shown in the field.
 *
 * @param value - The next input value.
 * @returns True when the value is empty or a partial decimal amount.
 */
export function isPartialHeroAmount(value: string): boolean {
  return HERO_AMOUNT_INPUT_PATTERN.test(value);
}

/** Widest Grotzec digit, in em. Every digit is counted at this width. */
export const HERO_AMOUNT_DIGIT_WIDTH_EM = 0.43;

/** Font size of the offscreen prefix probe. Its width divided by this is em. */
export const HERO_AMOUNT_PREFIX_PROBE_FONT_SIZE = 100;
