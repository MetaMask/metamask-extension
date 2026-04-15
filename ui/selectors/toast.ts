import { createSelector } from 'reselect';
import { createDeepEqualSelector } from '../../shared/lib/selectors/selector-creators';
import type { MetaMaskReduxState } from '../store/store';
import {
  TOAST_EXCLUDED_TRANSACTION_TYPES,
  TOAST_EXCLUDED_NON_EVM_TRANSACTION_TYPES,
} from '../helpers/constants/transactions';
import { EMPTY_ARRAY, EMPTY_OBJECT } from './shared';
import {
  selectRequiredTransactionHashes,
  selectRequiredTransactionIds,
} from './transactionController';

const selectTransactions = (state: MetaMaskReduxState) =>
  state.metamask?.transactions ?? EMPTY_ARRAY;

const selectNonEvmTransactions = (state: MetaMaskReduxState) =>
  state.metamask?.nonEvmTransactions ?? EMPTY_OBJECT;

const selectTxHistory = (state: MetaMaskReduxState) =>
  state.metamask?.txHistory ?? EMPTY_OBJECT;

export const selectTransactionIds = createSelector(
  selectTransactions,
  (transactions) => new Set<string>(transactions.map((tx) => tx.id)),
);

export const selectBridgeApprovalTxIds = createSelector(
  selectTxHistory,
  (txHistory) => {
    const ids = new Set<string>();
    for (const item of Object.values(txHistory)) {
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
    for (const [key, item] of Object.entries(txHistory)) {
      if (item.quote && item.quote.srcChainId !== item.quote.destChainId) {
        ids.add(key);
      }
    }
    return ids;
  },
);

/**
 * Returns EVM transactions eligible for toast notifications.
 *
 * @param {object} state - Root state
 * @returns {object[]} Filtered, deduplicated array of transaction objects
 */
export const selectEvmTransactionsForToast = createSelector(
  selectTransactions,
  selectBridgeApprovalTxIds,
  selectCrossChainBridgeSourceTxIds,
  selectRequiredTransactionIds,
  selectRequiredTransactionHashes,
  (
    rawTransactions,
    bridgeApprovalIds,
    crossChainBridgeIds,
    requiredTransactionIds,
    requiredTransactionHashes,
  ) => {
    if (!rawTransactions?.length) {
      return EMPTY_ARRAY;
    }

    const seen = new Set<string>();

    return rawTransactions.filter((transaction) => {
      if (seen.has(transaction.id)) {
        return false;
      }

      seen.add(transaction.id);

      const type = transaction?.type;
      if (typeof type !== 'string') {
        return false;
      }
      return (
        Boolean(type) &&
        !TOAST_EXCLUDED_TRANSACTION_TYPES.has(type) &&
        !bridgeApprovalIds.has(transaction.id?.toLowerCase()) &&
        !crossChainBridgeIds.has(transaction.id) &&
        !requiredTransactionIds.has(transaction.id) &&
        !(
          transaction.hash &&
          requiredTransactionHashes.has(transaction.hash.toLowerCase())
        )
      );
    });
  },
);

/**
 * Returns non-EVM transactions for toast notifications
 *
 * @param {object} state - Root state
 * @returns {object[]} Filtered array of non-EVM transaction objects
 */
export const selectNonEvmTransactionsForToast = createDeepEqualSelector(
  selectNonEvmTransactions,
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
