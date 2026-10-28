import {
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { hasTransactionType } from '../transactions.utils';

/**
 * Which Money Account flow a transaction belongs to. A single discriminated
 * result rather than two independent booleans, so a transaction that somehow
 * matched neither (or, in principle, both) transaction types is representable
 * as `undefined` instead of silently falling through whichever `if` happened
 * to run first.
 */
export enum MoneyAccountFlow {
  Deposit = 'deposit',
  Withdraw = 'withdraw',
}

/**
 * Resolves which Money Account flow a transaction belongs to, checking both
 * the transaction's own type and its nested transactions (batches created via
 * `addTransactionBatch` carry the money account type on a nested
 * transaction, not the parent).
 *
 * @param transaction - The transaction to check.
 * @returns The matching flow, or `undefined` if the transaction is not a
 * Money Account deposit or withdrawal.
 */
export function getMoneyAccountFlow(
  transaction: TransactionMeta | undefined,
): MoneyAccountFlow | undefined {
  if (hasTransactionType(transaction, [TransactionType.moneyAccountDeposit])) {
    return MoneyAccountFlow.Deposit;
  }

  if (hasTransactionType(transaction, [TransactionType.moneyAccountWithdraw])) {
    return MoneyAccountFlow.Withdraw;
  }

  return undefined;
}
