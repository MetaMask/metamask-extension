/**
 * Analytics helpers for Merkl claim bonus (bucketed reward ranges for Segment).
 * Mirrors mobile `getBonusAmountRange` in useMerklBonusClaim.
 *
 * @param bonusAmount - Formatted claimable amount (e.g. "< 0.01", "1.23")
 * @returns Bucket label for event properties
 */
export function getBonusAmountRange(bonusAmount: string): string {
  if (bonusAmount.startsWith('<')) {
    return '< 0.01';
  }
  const value = parseFloat(bonusAmount);
  if (Number.isNaN(value)) {
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
