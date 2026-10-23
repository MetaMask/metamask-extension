/**
 * Computes the percentage change between two numeric values.
 *
 * @param currentValue - The current/latest value
 * @param previousValue - The previous/baseline value to compare against
 * @returns The percentage change, or undefined if either value is missing or previousValue is zero
 *
 * @example
 * ```typescript
 * computePercentChange(110, 100) // Returns 10 (10% increase)
 * computePercentChange(90, 100)  // Returns -10 (10% decrease)
 * computePercentChange(100, 0)   // Returns undefined (division by zero)
 * computePercentChange(undefined, 100) // Returns undefined
 * ```
 */
export function computePercentChange(
  currentValue: number | undefined,
  previousValue: number | undefined,
): number | undefined {
  if (
    currentValue === undefined ||
    previousValue === undefined ||
    previousValue === 0
  ) {
    return undefined;
  }
  return ((currentValue - previousValue) / previousValue) * 100;
}
