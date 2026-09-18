import { createSelector } from 'reselect';
import {
  TransactionStatus,
  type TransactionControllerState,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { EMPTY_ARRAY } from './shared';

export type TransactionState = {
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

export const selectTransactionById = createSelector(
  selectTransactions,
  (_state: TransactionState, id: string | undefined) => id,
  (transactions, id) =>
    id ? transactions.find((tx) => tx.id === id) : undefined,
);

export const selectUnapprovedTransactionById = createSelector(
  selectTransactions,
  (_state: TransactionState, id: string | undefined) => id,
  (transactions, id) =>
    id
      ? transactions.find(
          (tx) => tx.id === id && tx.status === TransactionStatus.unapproved,
        )
      : undefined,
);

/**
 * A transaction is "replaced" once its speed-up/cancel replacement has fully
 * committed: the controller sets `replacedBy` (replacement hash) and
 * `replacedById` (replacement id) while the original keeps its own `hash`.
 *
 * @param transaction - Transaction metadata to inspect.
 * @returns Whether the original speed-up/cancel row should be dropped.
 */
function isReplacedTransaction(
  transaction: Pick<TransactionMeta, 'replacedBy' | 'replacedById' | 'hash'>,
): boolean {
  const { replacedBy, replacedById, hash } = transaction;
  return Boolean(replacedBy && replacedById && hash);
}

/**
 * Transactions that have not been fully replaced by a speed-up or cancel.
 * Partial replacement metadata is not enough to drop the original row.
 */
export const selectNonReplacedTransactions = createSelector(
  selectTransactions,
  (transactions) =>
    transactions.filter((transaction) => !isReplacedTransaction(transaction)),
);
