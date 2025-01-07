import {
  TransactionMeta,
  TransactionStatus,
} from '@metamask/transaction-controller';
import { isEqual } from 'lodash';
import { createSelectorCreator, lruMemoize } from 'reselect';

export const createDeepEqualSelector = createSelectorCreator(
  lruMemoize,
  isEqual,
);

export const filterAndShapeUnapprovedTransactions = (
  transactions: TransactionMeta[],
) => {
  return transactions
    .filter(({ status }) => status === TransactionStatus.unapproved)
    .reduce<{ [transactionId: string]: TransactionMeta }>(
      (result, transaction) => {
        result[transaction.id] = transaction;
        return result;
      },
      {},
    );
};
