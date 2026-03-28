import { createSelector } from 'reselect';
import { createDeepEqualSelector } from '../../shared/lib/selectors/util';
import type { MetaMaskReduxState } from '../store/store';
import {
  TOAST_EXCLUDED_TRANSACTION_TYPES,
  TOAST_EXCLUDED_NON_EVM_TRANSACTION_TYPES,
} from '../helpers/constants/transactions';
import { EMPTY_ARRAY } from './shared';

const selectTransactions = (state: MetaMaskReduxState) =>
  state.metamask?.transactions ?? [];

const selectTxHistory = (state: MetaMaskReduxState) =>
  state.metamask?.txHistory;

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

/**
 * Returns deduplicated EVM transactions eligible for toast notifications.
 * Swap polling inserts duplicate entries for the same tx id into raw state;
 * this selector keeps only the first occurrence per id.
 *
 * @param {object} state - Root state
 * @returns {object[]} Filtered, deduplicated array of transaction objects
 */
export const selectEvmTransactionsForToast = createSelector(
  (state: MetaMaskReduxState) => state.metamask?.transactions,
  selectBridgeApprovalTxIds,
  selectCrossChainBridgeSourceTxIds,
  (rawTransactions, bridgeApprovalIds, crossChainBridgeIds) => {
    if (!rawTransactions?.length) {
      return EMPTY_ARRAY;
    }
    const seen = new Set<string>();
    const result = [];
    for (const tx of rawTransactions) {
      if (seen.has(tx.id)) {
        continue; // skip duplicate entries for the same tx id
      }
      seen.add(tx.id);
      if (
        tx.type &&
        !TOAST_EXCLUDED_TRANSACTION_TYPES.has(tx.type) &&
        !bridgeApprovalIds.has(tx.id?.toLowerCase()) &&
        !crossChainBridgeIds.has(tx.id)
      ) {
        result.push(tx);
      }
    }
    return result;
  },
);

/**
 * Returns non-EVM transactions for toast notifications
 *
 * @param {object} state - Root state
 * @returns {object[]} Filtered array of non-EVM transaction objects
 */
export const selectNonEvmTransactionsForToast = createDeepEqualSelector(
  (state: MetaMaskReduxState) => state.metamask?.nonEvmTransactions,
  selectCrossChainBridgeSourceTxIds,
  (nonEvmTransactionsMap, crossChainBridgeIds) => {
    if (!nonEvmTransactionsMap) {
      return EMPTY_ARRAY;
    }

    return Object.values(nonEvmTransactionsMap)
      .flatMap((byChainMap) =>
        Object.values(byChainMap ?? {}).flatMap(
          (entry) => entry?.transactions ?? EMPTY_ARRAY,
        ),
      )
      .filter((transaction) => {
        const type = transaction?.type;
        return (
          Boolean(type) &&
          !TOAST_EXCLUDED_NON_EVM_TRANSACTION_TYPES.has(type) &&
          !crossChainBridgeIds.has(transaction.id)
        );
      });
  },
);
