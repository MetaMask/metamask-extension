/**
 * Floors a number to a fixed decimal precision while guarding against
 * IEEE-754 underflow around integer boundaries (e.g. 0.29 * 100).
 *
 * @param value - Numeric value to floor.
 * @param decimals - Decimal places to keep.
 * @returns Floored numeric value at the requested precision.
 */
export function floorToDecimals(value: number, decimals = 2): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const factor = 10 ** decimals;
  return Math.floor((value + Number.EPSILON) * factor) / factor;
}

/**
 * Floors a number to a fixed decimal precision and returns a fixed-width string.
 *
 * @param value - Numeric value to floor.
 * @param decimals - Decimal places to keep.
 * @returns Fixed-width floored decimal string.
 */
export function formatFlooredDecimals(value: number, decimals = 2): string {
  return floorToDecimals(value, decimals).toFixed(decimals);
}
