import { MUSD_DECIMALS } from '@metamask/money-account-utils';
import { TransactionPayStrategy } from '@metamask/transaction-pay-controller';
import { BigNumber } from 'bignumber.js';

/**
 * The fields confirm and the footer need from the quote that publish will
 * execute. Pay submits this quote, not the amount currently shown in the field.
 */
export type DepositQuoteAmount = {
  request?: {
    isMaxAmount?: boolean;
    sourceTokenAmount?: string;
    targetAmountMinimum?: string;
  };
  strategy?: string;
};

/**
 * Converts a human-readable mUSD amount to base units.
 * Uses the same `ROUND_UP` rules as the background deposit commit.
 *
 * @param amountHuman - Exact human-readable mUSD amount.
 * @returns Raw amount as a decimal string, or `undefined` when invalid.
 */
function musdHumanToRaw(amountHuman: string | undefined): string | undefined {
  if (!amountHuman) {
    return undefined;
  }

  let value: BigNumber;
  try {
    value = new BigNumber(amountHuman);
  } catch {
    return undefined;
  }

  if (!value.isFinite() || value.lte(0)) {
    return undefined;
  }

  const raw = value.times(10 ** MUSD_DECIMALS).round(0, BigNumber.ROUND_UP);
  return raw.toString(10);
}

function rawEquals(left: string | undefined, right: string): boolean {
  if (!left) {
    return false;
  }
  try {
    return BigInt(left) === BigInt(right);
  } catch {
    return false;
  }
}

/**
 * Whether the quote Pay would publish was requested for `amountHuman`.
 *
 * A Max quote stays executable through the amount debounce. Comparing the
 * field to that quote keeps Add funds from submitting the full balance after
 * the user has typed a smaller amount.
 *
 * `targetAmountMinimum` is the required mUSD amount the quote was built for.
 * Max quotes that omit it fall back to the pay-token source amount, which is
 * the deposited amount for a no-fee 1:1 token.
 *
 * @param quote - Executable pay quote, if one is loaded.
 * @param amountHuman - Latest recorded human-readable mUSD amount.
 * @returns Whether publishing this quote deposits `amountHuman`.
 */
export function doesDepositQuoteMatchAmount(
  quote: DepositQuoteAmount | undefined,
  amountHuman: string | undefined,
): boolean {
  if (!quote || quote.strategy === TransactionPayStrategy.None) {
    return false;
  }

  const expectedRaw = musdHumanToRaw(amountHuman);
  if (!expectedRaw) {
    return false;
  }

  const targetMinimum = quote.request?.targetAmountMinimum;
  if (targetMinimum && targetMinimum !== '0') {
    return rawEquals(targetMinimum, expectedRaw);
  }

  return (
    Boolean(quote.request?.isMaxAmount) &&
    rawEquals(quote.request?.sourceTokenAmount, expectedRaw)
  );
}
