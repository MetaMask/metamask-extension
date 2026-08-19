import BigNumber from 'bignumber.js';
import { formatWithThreshold } from '../../components/app/assets/util/formatWithThreshold';

// One cent. Values strictly below this collapse to $0.00 — mUSD is USD-pegged
// so sub-cent fiat is economically meaningless.
export const DUST_THRESHOLD = 0.01;

/**
 * Formats a US-dollar value with proper dollar formatting ($1,234.56),
 * independent of the user's preferred currency or locale. Money Account
 * amounts are mUSD (USD-pegged) and are always shown in dollars.
 *
 * Sub-cent dust collapses to `$0.00` first, so `<$0.01` is never shown for a
 * positive balance in the Money domain. Behavioural parity with mobile's
 * `moneyFormatUsd` (`app/components/UI/Money/utils/moneyFormatFiat.ts`),
 * including the empty string for a `NaN` input.
 *
 * @param value - The dollar value to format.
 * @returns The formatted dollar value.
 */
export const moneyFormatUsd = (value: BigNumber): string => {
  if (value.isNaN()) {
    return '';
  }

  const effective = value.abs().lt(DUST_THRESHOLD) ? new BigNumber(0) : value;

  return formatWithThreshold(effective.toNumber(), DUST_THRESHOLD, 'en-US', {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'narrowSymbol',
  });
};
