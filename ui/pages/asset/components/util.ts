/**
 * Returns the number of decimals the fiat price should be formatted to.
 * This exists because `currency-formatter` defaults to the precision
 * of the fiat currency (e.g. 2 for a minimum of $0.01). But tokens
 * can have smaller prices like $0.000001365 that must be supported.
 *
 * @param price - The fiat price to determine formatting precision.
 */
export const getPricePrecision = (price: number) => {
  let precision = 2;
  for (let p = Math.abs(price); p < 1; precision++) {
    p *= 10;
  }
  return precision;
};
