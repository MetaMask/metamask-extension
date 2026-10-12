import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { BigNumber } from 'bignumber.js';
import {
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { TransactionPayStrategy } from '@metamask/transaction-pay-controller';
import { hasTransactionType } from '../../../../../shared/lib/transactions.utils';
import {
  selectTransactionPayQuotesByTransactionId,
  type TransactionPayState,
} from '../../../../selectors/transactionPayController';
import { useConfirmContext } from '../../context/confirm';
import { doesDepositQuoteMatchAmount } from '../../utils/money-account-deposit-quote';
import { useLastMoneyAccountDepositAmount } from './useLastMoneyAccountDepositAmount';

export type MoneyAccountDepositQuoteState = {
  /** Whether this confirmation is a Money Account deposit, including batches. */
  isMoneyAccountDeposit: boolean;
  /** Human mUSD amount recorded on the keystroke, before the quote refresh. */
  lastDepositAmount: string | undefined;
  /** Whether the executable quote was requested for `lastDepositAmount`. */
  quoteMatches: boolean;
  /**
   * A positive typed amount is showing, but publish would still use the
   * previous quote. Footer and quote rows stay pending until this is false.
   */
  isQuoteStale: boolean;
};

/**
 * Shared view of the Money Account deposit quote versus the amount the user
 * typed. The Max quote stays executable through the amount debounce, so the
 * footer, quote rows, and confirm all need the same comparison.
 *
 * @returns Whether the current confirmation is a deposit and whether its
 * executable quote matches the recorded amount.
 */
export function useMoneyAccountDepositQuote(): MoneyAccountDepositQuoteState {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const transactionId = currentConfirmation?.id ?? '';
  const isMoneyAccountDeposit = hasTransactionType(currentConfirmation, [
    TransactionType.moneyAccountDeposit,
  ]);
  const lastDepositAmount = useLastMoneyAccountDepositAmount(transactionId);
  const quotes = useSelector((state: TransactionPayState) =>
    selectTransactionPayQuotesByTransactionId(state, transactionId),
  );
  const executableQuote = useMemo(
    () =>
      quotes?.find((quote) => quote.strategy !== TransactionPayStrategy.None),
    [quotes],
  );
  const quoteMatches = doesDepositQuoteMatchAmount(
    executableQuote,
    lastDepositAmount,
  );
  const isQuoteStale =
    isMoneyAccountDeposit &&
    isPositiveAmount(lastDepositAmount) &&
    !quoteMatches;

  return {
    isMoneyAccountDeposit,
    lastDepositAmount,
    quoteMatches,
    isQuoteStale,
  };
}

function isPositiveAmount(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  return new BigNumber(value).gt(0);
}
