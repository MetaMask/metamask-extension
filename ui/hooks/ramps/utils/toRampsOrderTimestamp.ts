/**
 * `RampsOrder.createdAt` is typed as epoch milliseconds, but orders that reach
 * the client through User Storage / Portfolio can carry an ISO date string
 * instead. Mixing the two breaks numeric sorting, because `string - number`
 * yields `NaN` and a comparator returning `NaN` leaves the list unsorted.
 *
 * @param value - A timestamp that may be epoch milliseconds or an ISO string.
 * @returns Epoch milliseconds, or `0` when the value cannot be parsed.
 */
export function toRampsOrderTimestamp(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const numericValue = Number(value);
    if (value.trim() && Number.isFinite(numericValue)) {
      return numericValue;
    }

    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}
