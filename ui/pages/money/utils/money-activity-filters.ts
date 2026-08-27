import {
  type TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import type { MoneyActivityItem } from '../types/money-activity';

/**
 * Filter chips on the Money Activity page. Values match mobile; the
 * transfers chip is labeled "Sends".
 */
export enum MoneyActivityFilter {
  All = 'all',
  Deposits = 'deposits',
  Transfers = 'transfers',
}

export type MoneyActivityBuckets = Record<
  MoneyActivityFilter,
  MoneyActivityItem[]
>;

export function isMoneyActivityDeposit(tx: TransactionMeta): boolean {
  if (
    tx.type === TransactionType.incoming ||
    tx.type === TransactionType.moneyAccountDeposit ||
    // Same received types as classifyMoneyActivity, so ERC-20 receives
    // stay in All / Deposits instead of vanishing off the Activity page.
    tx.type === TransactionType.tokenMethodTransfer ||
    tx.type === TransactionType.tokenMethodTransferFrom
  ) {
    return true;
  }

  return (
    tx.nestedTransactions?.some(
      (nested) => nested.type === TransactionType.moneyAccountDeposit,
    ) ?? false
  );
}

export function isMoneyActivityTransfer(tx: TransactionMeta): boolean {
  if (
    tx.type === TransactionType.moneyAccountWithdraw ||
    tx.type === TransactionType.simpleSend
  ) {
    return true;
  }

  return (
    tx.nestedTransactions?.some(
      (nested) => nested.type === TransactionType.moneyAccountWithdraw,
    ) ?? false
  );
}

export function isMoneyActivityTransaction(tx: TransactionMeta): boolean {
  return isMoneyActivityDeposit(tx) || isMoneyActivityTransfer(tx);
}

/**
 * Splits on-chain activity into All / Deposits / Sends buckets.
 *
 * @param items - Newest-first on-chain activity items.
 * @returns Filter buckets. All is the union of Deposits and Sends.
 */
export function buildMoneyActivityBuckets(
  items: MoneyActivityItem[],
): MoneyActivityBuckets {
  const deposits = items.filter((item) => isMoneyActivityDeposit(item.tx));
  const transfers = items.filter((item) => isMoneyActivityTransfer(item.tx));

  return {
    [MoneyActivityFilter.All]: items.filter((item) =>
      isMoneyActivityTransaction(item.tx),
    ),
    [MoneyActivityFilter.Deposits]: deposits,
    [MoneyActivityFilter.Transfers]: transfers,
  };
}

export const EMPTY_MONEY_ACTIVITY_BUCKETS: MoneyActivityBuckets = {
  [MoneyActivityFilter.All]: [],
  [MoneyActivityFilter.Deposits]: [],
  [MoneyActivityFilter.Transfers]: [],
};
