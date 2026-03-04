import { createSelector } from 'reselect';
import type {
  TransactionControllerState,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { EMPTY_ARRAY } from './shared';

type TransactionState = {
  metamask: TransactionControllerState;
};

export const selectTransactions = (
  state: TransactionState,
): TransactionMeta[] => state.metamask?.transactions ?? EMPTY_ARRAY;

export const selectOrderedTransactions = createSelector(
  selectTransactions,
  (transactions) => [...transactions].sort((a, b) => a.time - b.time), // Ascending
);

export const selectRequiredTransactionIds = createSelector(
  selectTransactions,
  (transactions) =>
    new Set(transactions.flatMap((tx) => tx.requiredTransactionIds ?? [])),
);

export const selectRequiredTransactions = createSelector(
  selectTransactions,
  selectRequiredTransactionIds,
  (transactions, requiredIds) =>
    transactions.filter((tx) => requiredIds.has(tx.id)),
);

export const selectRequiredTransactionHashes = createSelector(
  selectRequiredTransactions,
  (transactions) =>
    new Set(
      transactions
        .map((tx) => tx.hash?.toLowerCase())
        .filter(Boolean) as string[],
    ),
);
