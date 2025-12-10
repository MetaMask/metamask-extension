/**
 * Limits a number to a max decimal places.
 * @param {number} num
 * @param {number} maxDecimalPlaces
 * @returns {string}
 */
export function limitToMaximumDecimalPlaces(
  num: number,
  maxDecimalPlaces = 5,
): string {
  if (isNaN(num) || isNaN(maxDecimalPlaces)) {
    return num.toString();
  }
  const base = Math.pow(10, maxDecimalPlaces);
  return (Math.round(num * base) / base).toString();
}
