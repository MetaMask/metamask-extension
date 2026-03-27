import { createSelector } from 'reselect';

// Isolated in its own file to break a circular import chain:
//   transactions.js → bridge-status/selectors.ts → account-tree.ts → selectors.js → transactions.js
// Reads raw metamask state directly so neither side needs to import the other.

const getRawTransactions = (state: {
  metamask?: { transactions?: { id: string }[] };
}) => state.metamask?.transactions ?? [];

const getRawTxHistory = (state: {
  metamask?: { txHistory?: Record<string, { approvalTxId?: string }> };
}) => state.metamask?.txHistory;

/**
 * Returns all EVM transaction IDs.
 * Used by bridge-status/selectors.ts to cross-reference live transactions
 * without creating a circular import.
 */
export const selectCurrentAccountEvmTransactionIds = createSelector(
  getRawTransactions,
  (transactions) => new Set<string>(transactions.map((tx) => tx.id)),
);

/**
 * Returns a Set of lowercased bridge approval transaction IDs.
 * Reads raw txHistory directly to avoid importing bridge-status/selectors.ts
 * into transactions.js (which would re-introduce the circular dependency).
 */
export const selectBridgeApprovalTxIds = createSelector(
  getRawTxHistory,
  (txHistory) => {
    const ids = new Set<string>();
    for (const item of Object.values(txHistory ?? {})) {
      if (item.approvalTxId) {
        ids.add(item.approvalTxId.toLowerCase());
      }
    }
    return ids;
  },
);
