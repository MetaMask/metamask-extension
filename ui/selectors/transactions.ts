import {
  TransactionControllerState,
  TransactionStatus,
} from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
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
  (_state: TransactionsRootState, transactionId: string | undefined) =>
    transactionId,
  (transactions, transactionId) =>
    transactions.find((tx) => tx.id === transactionId),
);

export const selectUnapprovedTransactionById = createSelector(
  selectTransactionById,
  (transaction) =>
    transaction?.status === TransactionStatus.unapproved
      ? transaction
      : undefined,
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

export const selectHasSubmittedTransactionsMatchingTransaction = createSelector(
  selectTransactions,
  (_state: TransactionsRootState, chainId: Hex | undefined) => chainId,
  (
    _state: TransactionsRootState,
    _chainId: Hex | undefined,
    from: Hex | undefined,
  ) => from,
  (transactions, chainId, from) =>
    transactions.some(
      (tx) =>
        tx.status === TransactionStatus.submitted &&
        tx.chainId === chainId &&
        tx.txParams.from === from,
    ),
);
