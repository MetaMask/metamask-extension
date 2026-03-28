import { createSelector } from 'reselect';

// Isolated in its own file to break a circular import chain:
// transactions.js → bridge-status/selectors.ts → account-tree.ts → selectors.js → transactions.js

const selectTransactions = (state: {
  metamask?: { transactions?: { id: string }[] };
}) => state.metamask?.transactions ?? [];

const selectTxHistory = (state: {
  metamask?: {
    txHistory?: Record<
      string,
      {
        approvalTxId?: string;
        quote?: { srcChainId?: number | string; destChainId?: number | string };
      }
    >;
  };
}) => state.metamask?.txHistory;

export const selectTransactionIds = createSelector(
  selectTransactions,
  (transactions) => new Set<string>(transactions.map((tx) => tx.id)),
);

export const selectBridgeApprovalTxIds = createSelector(
  selectTxHistory,
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

export const selectCrossChainBridgeSourceTxIds = createSelector(
  selectTxHistory,
  (txHistory) => {
    const ids = new Set<string>();
    for (const [key, item] of Object.entries(txHistory ?? {})) {
      if (item.quote?.srcChainId !== item.quote?.destChainId) {
        ids.add(key);
      }
    }
    return ids;
  },
);
