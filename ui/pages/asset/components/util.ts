/**
 * Formats a potentially large number to the nearest unit.
 * e.g. 1T for trillions, 2.3B for billions, 4.56M for millions, 7,890 for thousands, etc.
 *
 * @param t - An I18nContext translator.
 * @param number - The number to format.
 * @returns A localized string of the formatted number + unit.
 */
export const localizeLargeNumber = (t: any, number: number) => {
  if (number >= 1000000000000) {
    return `${(number / 1000000000000).toFixed(2)}${t('trillionAbbreviation')}`;
  } else if (number >= 1000000000) {
    return `${(number / 1000000000).toFixed(2)}${t('billionAbbreviation')}`;
  } else if (number >= 1000000) {
    return `${(number / 1000000).toFixed(2)}${t('millionAbbreviation')}`;
  }
  return number.toFixed(2);
};

/**
 * Returns the number of decimals the fiat price should be formatted to.
 * This tells `currency-formatter` to render prices < 1 cent like $0.00001234
 *
 * @param price - The fiat price to determine formatting precision.
 */
export const getPricePrecision = (price: number) => {
  if (price === 0) {
    return 1;
  }
  let precision = 2;
  for (let p = Math.abs(price); p < 1; precision++) {
    p *= 10;
  }
  return precision;
};
