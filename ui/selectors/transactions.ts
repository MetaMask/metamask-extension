import {
  TransactionControllerState,
  TransactionStatus,
} from '@metamask/transaction-controller';
import { createSelector } from 'reselect';

export type TransactionsRootState = {
  metamask: TransactionControllerState;
};

const selectTransactions = createSelector(
  (state: TransactionsRootState) => state.metamask.transactions,
  (transactions) => transactions ?? [],
);

export const selectTransactionById = createSelector(
  selectTransactions,
  (_state: TransactionsRootState, transactionId: string) => transactionId,
  (transactions, transactionId) =>
    transactions.find((tx) => tx.id === transactionId),
);

export const selectUnapprovedTransactionById = createSelector(
  selectTransactions,
  (_state: TransactionsRootState, transactionId: string) => transactionId,
  (transactions, transactionId) =>
    transactions.find(
      (tx) =>
        tx.id === transactionId && tx.status === TransactionStatus.unapproved,
    ),
);

export const selectHasSigningOrSubmittingTransactions = createSelector(
  selectTransactions,
  (transactions) =>
    transactions.some((tx) =>
      [TransactionStatus.approved, TransactionStatus.signed].includes(
        tx.status,
      ),
    ),
);
