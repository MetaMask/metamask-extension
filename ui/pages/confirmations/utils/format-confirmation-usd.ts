import BigNumber from 'bignumber.js';

const USD_DUST_THRESHOLD = 0.01;

/**
 * Formats a USD amount with `$` only (`narrowSymbol`) and `en-US` separators,
 * independent of the user's locale.
 *
 * @param amount - Dollar amount to format.
 * @returns Formatted USD string (e.g. `$1,234.50`).
 */
export function formatConfirmationUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'narrowSymbol',
  }).format(amount);
}

/**
 * Formats a USD amount for confirmation dialog headlines, omitting `.00` on
 * whole dollar amounts while preserving cents when non-zero (e.g. `$100` vs
 * `$99.95`).
 *
 * @param value - Dollar amount to format.
 * @returns Compact USD string with `$` and `en-US` separators.
 */
export function formatCompactConfirmationUsd(value: BigNumber): string {
  if (value.isNaN() || !value.isFinite()) {
    return '';
  }

  const effective = value.abs().lt(USD_DUST_THRESHOLD)
    ? new BigNumber(0)
    : value;
  const rounded = effective.round(2, BigNumber.ROUND_HALF_UP);
  const isWhole = rounded.eq(rounded.round(0, BigNumber.ROUND_DOWN));

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(rounded.toNumber());
}
