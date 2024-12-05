import {
  TransactionMeta,
  TransactionStatus,
} from '@metamask/transaction-controller';
import { isEqual } from 'lodash';
import { createSelectorCreator, defaultMemoize } from 'reselect';

export const createDeepEqualSelector = createSelectorCreator(
  defaultMemoize,
  isEqual,
);

export const filterAndShapeUnapprovedTransactions = (
  transactions: TransactionMeta[],
) => {
  return transactions
    .filter(({ status }) => status === TransactionStatus.unapproved)
    .reduce<Record<string, TransactionMeta>>((result, transaction) => {
      result[transaction.id] = transaction;
      return result;
    }, {} as never);
};
