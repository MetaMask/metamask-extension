/**
 * Limits a number to a max decimal places.
 *
 * @param num - The number to limit
 * @param maxDecimalPlaces - The maximum number of decimal places
 * @returns The number limited to the maximum decimal places
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
