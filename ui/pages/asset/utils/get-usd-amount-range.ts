export type UsdAmountRange =
  | '< 0.01'
  | '0.01 - 0.99'
  | '1.00 - 9.99'
  | '10.00 - 99.99'
  | '100.00 - 999.99'
  | '1000.00+';

/**
 * Buckets a USD amount for analytics without reporting its exact value.
 *
 * @param amount - Numeric amount or formatted display string.
 * @returns The analytics range containing the amount.
 */
export function getUsdAmountRange(
  amount: number | string | undefined,
): UsdAmountRange {
  if (typeof amount === 'string') {
    if (amount.startsWith('<')) {
      return '< 0.01';
    }
    return getUsdAmountRange(parseFloat(amount));
  }

  const value = amount ?? 0;
  if (!Number.isFinite(value) || value < 0.01) {
    return '< 0.01';
  }
  if (value < 1) {
    return '0.01 - 0.99';
  }
  if (value < 10) {
    return '1.00 - 9.99';
  }
  if (value < 100) {
    return '10.00 - 99.99';
  }
  if (value < 1000) {
    return '100.00 - 999.99';
  }
  return '1000.00+';
}
