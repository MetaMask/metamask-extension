import BigNumber from 'bignumber.js';
import { formatWithThreshold } from '../../components/app/assets/util/formatWithThreshold';

// One cent. Values strictly below this collapse to $0.00 — mUSD is USD-pegged
// so sub-cent fiat is economically meaningless.
export const DUST_THRESHOLD = 0.01;

/**
 * Whether a Money balance is large enough to display as a real figure. This
 * is the same one-cent threshold `moneyFormatUsd` collapses to `$0.00`, so a
 * balance that formats as zero is never treated as funded.
 *
 * @param tokenTotal - The mUSD balance, if known.
 * @returns `true` when at least one cent is held.
 */
export const isMoneyBalanceFunded = (tokenTotal: BigNumber | undefined) =>
  tokenTotal?.abs().gte(DUST_THRESHOLD) === true;

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

/**
 * Formats a balance the user is allowed to spend down to the last cent.
 *
 * {@link moneyFormatUsd} rounds half-up, so a balance of `0.499999` renders as
 * `$0.50` — a cent more than is actually held. The amount input only accepts
 * two decimals, so the smallest amount matching that label is `0.50`, which
 * fails the balance check and blocks the withdraw with "Insufficient funds"
 * (CONF-2196). Rounding the *displayed* figure half-up is only safe for
 * read-only totals; anywhere the label doubles as a spendable target it must
 * round down so the advertised amount is always affordable.
 *
 * Sub-cent dust still collapses to `$0.00` via {@link moneyFormatUsd}, and the
 * underlying raw value is left untouched so Max can still withdraw in full.
 *
 * `round(dp, rm)`, not `decimalPlaces`: this repo pins `bignumber.js@4` where
 * `decimalPlaces` is a getter returning the place *count*.
 *
 * @param value - The dollar value to format.
 * @returns The formatted dollar value, never above `value`.
 */
export const moneyFormatUsdSpendable = (value: BigNumber): string =>
  moneyFormatUsd(value.isNaN() ? value : value.round(2, BigNumber.ROUND_DOWN));
