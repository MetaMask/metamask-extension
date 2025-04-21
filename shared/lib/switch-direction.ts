/**
 * A few locales that we know are right-to-left, but not all of them, and some
 * we don't even support. ¯\_(ツ)_/¯
 */
export const rtlLocales = new Set(['ar', 'dv', 'fa', 'he', 'ku']);
/**
 * Switch the CSS rules used between 'rtl' and 'ltr'
 *
 * This function modifies the document's text direction based on the provided locale.
 *
 * @param direction - Text direction, either left-to-right (ltr, auto) or right-to-left (rtl)
 */
export const switchDirection = (direction: 'ltr' | 'rtl' | 'auto'): void => {
  document.documentElement.dir = direction === 'auto' ? 'ltr' : direction;
};

/**
 * Get the text direction for a given locale.
 *
 * @param locale - The preferred language locale
 * @returns The text direction, either 'ltr' or 'rtl'
 */
export const getDirectionForPreferredLocale = (locale: string) => {
  const textDirection = rtlLocales.has(locale) ? 'rtl' : 'ltr';
  return textDirection;
};

/**
 * Switch the CSS rules used between 'rtl' and 'ltr' based on the preferred locale.
 *
 * This function modifies the document's text direction based on the provided locale.
 *
 * @param locale - The preferred language locale
 */
export const switchDirectionForLocale = (locale: string): void => {
  const textDirection = getDirectionForPreferredLocale(locale);
  switchDirection(textDirection);
};
