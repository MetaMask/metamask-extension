import {
  HERO_AMOUNT_FONT_SIZES,
  HERO_AMOUNT_MIN_FONT_SIZE,
  type HeroAmountFontSize,
} from './hero-amount-input.constants';

/**
 * Picks the largest step at or below `maxFontSize` at which text `widthEm`
 * wide fits `availableWidth`. Text that does not fit at the floor stays at
 * the floor and scrolls inside the field.
 *
 * @param widthEm - Width of the prefix and amount, in em.
 * @param availableWidth - Width of the row in px.
 * @param maxFontSize - Largest step to start from.
 * @returns The font size in px.
 */
export function getHeroAmountFontSize(
  widthEm: number,
  availableWidth: number,
  maxFontSize: HeroAmountFontSize,
): HeroAmountFontSize {
  for (const fontSize of HERO_AMOUNT_FONT_SIZES) {
    if (fontSize <= maxFontSize && widthEm * fontSize <= availableWidth) {
      return fontSize;
    }
  }
  return HERO_AMOUNT_MIN_FONT_SIZE;
}
