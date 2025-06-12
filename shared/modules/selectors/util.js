import { TransactionStatus } from '@metamask/transaction-controller';
import { isEqual } from 'lodash';
import { createSelectorCreator, lruMemoize } from 'reselect';

export const createDeepEqualSelector = createSelectorCreator(
  lruMemoize,
  isEqual,
);

export const filterAndShapeUnapprovedTransactions = (transactions) => {
  return transactions
    .filter(({ status }) => status === TransactionStatus.unapproved)
    .reduce((result, transaction) => {
      result[transaction.id] = transaction;
      return result;
    }, {});
};
