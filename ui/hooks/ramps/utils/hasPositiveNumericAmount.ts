/**
 * Returns true when `value` is a finite number greater than zero.
 *
 * Accepts string or number inputs (as returned by the ramps API / mapper).
 *
 * @param value - Candidate amount.
 * @returns Whether the value is a displayable positive amount.
 */
export function hasPositiveNumericAmount(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0;
}
