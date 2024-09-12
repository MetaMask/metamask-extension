import { TransactionStatus } from '@metamask/transaction-controller';
import { isEqual } from 'lodash';
import { createSelectorCreator, defaultMemoize } from 'reselect';

export const createDeepEqualSelector = createSelectorCreator(
  defaultMemoize,
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

export const testId = (id) => `[data-testid=${id}]`;
