/**
 * Shared auto-shrink scale for large number amount inputs set in the Hero
 * (Grotzec Cond Bold) family. Every large amount input picks its font size
 * here so the steps cannot drift between features.
 *
 * Steps follow the Mobile Grotzec amount inputs: an 88px start (MM Pay and
 * Ramp quote) with a step down roughly every few characters, ending at the
 * 20px floor used by the Mobile MM Pay amount.
 */
export const AMOUNT_INPUT_FONT_SIZES = [
  88, 72, 60, 48, 40, 32, 24, 20,
] as const;

export type AmountInputFontSize = (typeof AMOUNT_INPUT_FONT_SIZES)[number];

export const AMOUNT_INPUT_MAX_FONT_SIZE: AmountInputFontSize =
  AMOUNT_INPUT_FONT_SIZES[0];

export const AMOUNT_INPUT_MIN_FONT_SIZE: AmountInputFontSize =
  AMOUNT_INPUT_FONT_SIZES.at(-1) ?? 20;

/**
 * Content width of a full-width amount row in the 360px popup (16px page
 * padding on each side). Inputs measure their real width with
 * `useAmountInputFontSize`; this is the fallback before the first layout.
 */
export const AMOUNT_INPUT_POPUP_WIDTH = 328;

// Advance widths in em of Grotzec Cond Bold. Digits use the widest digit so
// the size depends only on how many characters are typed.
const DIGIT_WIDTH_EM = 0.43;
const SEPARATOR_WIDTH_EM = 0.21;
const SPACE_WIDTH_EM = 0.15;
const MINUS_WIDTH_EM = 0.27;
const LATIN_LETTER_WIDTH_EM = 0.5;
// M and W are the only letters wider than 0.5em (up to 0.68em).
const WIDE_LATIN_LETTER_WIDTH_EM = 0.68;
const WIDE_LATIN_LETTERS = new Set(['M', 'W', 'm', 'w']);
const GROTZEC_SYMBOL_WIDTH_EM = 0.47;
// Grotzec has no glyph for symbols such as ₹ ₩ ₿, so they render in the
// fallback family, where ₩ is up to ~0.95em wide.
const FALLBACK_GLYPH_WIDTH_EM = 1;

const GROTZEC_SYMBOLS = new Set(['$', '€', '£', '¥', '¢']);
const SPACES = new Set([' ', '\u00a0', '\u202f']);

function getCharacterWidthEm(character: string): number {
  if (character >= '0' && character <= '9') {
    return DIGIT_WIDTH_EM;
  }
  if (character === '.' || character === ',') {
    return SEPARATOR_WIDTH_EM;
  }
  if (SPACES.has(character)) {
    return SPACE_WIDTH_EM;
  }
  if (character === '-') {
    return MINUS_WIDTH_EM;
  }
  if (WIDE_LATIN_LETTERS.has(character)) {
    return WIDE_LATIN_LETTER_WIDTH_EM;
  }
  if (/^[A-Za-z]$/u.test(character)) {
    return LATIN_LETTER_WIDTH_EM;
  }
  if (GROTZEC_SYMBOLS.has(character)) {
    return GROTZEC_SYMBOL_WIDTH_EM;
  }
  return FALLBACK_GLYPH_WIDTH_EM;
}

/**
 * Estimates the rendered width of an amount in em of the Hero family.
 *
 * @param text - The amount as rendered, including any currency symbol.
 * @returns The estimated width in em.
 */
export function estimateAmountTextWidthEm(text: string): number {
  let width = 0;
  for (const character of text) {
    width += getCharacterWidthEm(character);
  }
  return width;
}

export type AmountInputFontSizeOptions = {
  /** Width in px available to the symbol and amount. */
  availableWidth?: number;
  /**
   * Largest step to start from. Only for layouts that cannot fit the 88px
   * start, such as the two stacked Swap/Bridge fields.
   */
  maxFontSize?: AmountInputFontSize;
};

/**
 * Picks the largest step of the shared scale at which the amount fits the
 * available width. Values that do not fit at the minimum stay at the minimum
 * and scroll inside the input. Line height equals the font size.
 *
 * @param text - The amount as rendered, including any currency symbol.
 * @param options - Layout constraints of the input.
 * @param options.availableWidth - Width in px available to the text.
 * @param options.maxFontSize - Largest step to start from.
 * @returns The font size in px.
 */
export function getAmountInputFontSize(
  text: string,
  {
    availableWidth = AMOUNT_INPUT_POPUP_WIDTH,
    maxFontSize = AMOUNT_INPUT_MAX_FONT_SIZE,
  }: AmountInputFontSizeOptions = {},
): AmountInputFontSize {
  const widthEm = estimateAmountTextWidthEm(text);

  for (const fontSize of AMOUNT_INPUT_FONT_SIZES) {
    if (fontSize <= maxFontSize && widthEm * fontSize <= availableWidth) {
      return fontSize;
    }
  }
  return AMOUNT_INPUT_MIN_FONT_SIZE;
}

/**
 * Eases each step change of the scale. Apply it to every element that takes
 * `getAmountInputTextStyle`, including the measuring element, so the input
 * box and its text change size together. `color` is listed because the class
 * replaces the MMDS `Input` `transition-colors` when merged.
 */
export const AMOUNT_INPUT_TRANSITION_CLASS_NAME =
  'transition-[color,font-size,line-height] duration-100 ease-out motion-reduce:transition-none';

/**
 * Inline style for an amount at the given step, with line height equal to the
 * font size as on Mobile.
 *
 * @param fontSize - A step of the shared scale.
 * @returns The style for the symbol, measuring element and input.
 */
export function getAmountInputTextStyle(fontSize: AmountInputFontSize): {
  fontSize: number;
  lineHeight: string;
} {
  return { fontSize, lineHeight: `${fontSize}px` };
}
