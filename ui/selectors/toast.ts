import { createSelector } from 'reselect';
import type { BridgeHistoryItem } from '@metamask/bridge-status-controller';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { isCrossChain, StatusTypes } from '@metamask/bridge-controller';
import { SmartTransactionStatuses } from '@metamask/smart-transactions-controller';
import { createDeepEqualSelector } from '../../shared/lib/selectors/selector-creators';
import { SMART_TRANSACTION_CONFIRMATION_TYPES } from '../../shared/constants/app';
import { getBridgeTransactionToastId } from '../helpers/utils/toasts';
import type { MetaMaskReduxState } from '../store/store';
import {
  TOAST_EXCLUDED_TRANSACTION_TYPES,
  TOAST_EXCLUDED_NON_EVM_TRANSACTION_TYPES,
} from '../helpers/constants/transactions';
import { isBridgeComplete } from '../../shared/lib/bridge-status/utils';
import { getPendingApprovals } from './approvals';
import { EMPTY_ARRAY, EMPTY_OBJECT } from './shared';
import { selectCurrentAccountIds } from './multichain-transactions';
import { selectNonEvmChainIds } from './multichain/networks';
import {
  selectRequiredTransactionHashes,
  selectRequiredTransactionIds,
} from './transactionController';

export type NonEvmToastEligibilityCriteria = {
  currentAccountIds: Set<string>;
  enabledNonEvmChainIds: Set<string>;
  crossChainBridgeIds: Set<string>;
};

type NonEvmToastTransaction = {
  id?: string;
  type?: string;
  account?: string;
  chain?: string;
};

export type BridgeSmartStatusToastState = {
  approvalId: string;
  status?: string;
  toastId: string;
  txId?: string;
  isPending: boolean;
  isSuccess: boolean;
  isFailed: boolean;
};

export type BridgeHistoryToastState = {
  toastId: string;
  txId?: string;
  status?: string;
  isSuccess: boolean;
  isFailed: boolean;
};

type SmartStatusRequestState = {
  txId?: string;
  smartTransaction?: {
    status?: string;
  };
};

const selectTransactions = (state: MetaMaskReduxState) =>
  state.metamask?.transactions ?? EMPTY_ARRAY;

const selectNonEvmTransactions = (state: MetaMaskReduxState) =>
  state.metamask?.nonEvmTransactions ?? EMPTY_OBJECT;

const selectTxHistory = (state: MetaMaskReduxState) =>
  state.metamask?.txHistory ?? EMPTY_OBJECT;

// Smart-status approvals only know about a tx id, so bridge toast startup needs to resolve that to bridge history.
function findBridgeHistoryItemForTxId(
  txHistory: Record<string, BridgeHistoryItem>,
  txId?: string,
) {
  if (!txId) {
    return undefined;
  }

  if (txHistory[txId]) {
    return txHistory[txId];
  }

  return Object.values(txHistory).find(
    (item) =>
      item.originalTransactionId === txId ||
      item.txMetaId === txId ||
      item.approvalTxId === txId,
  );
}

// Smart-status approval data is only used to decide whether a bridge toast should start pending.
function getBridgeSmartStatusToastState(
  approvalId: string,
  bridgeHistoryItem: BridgeHistoryItem | undefined,
  requestState: SmartStatusRequestState | undefined,
): BridgeSmartStatusToastState {
  const txId =
    bridgeHistoryItem?.originalTransactionId ??
    bridgeHistoryItem?.txMetaId ??
    requestState?.txId;
  const status = requestState?.smartTransaction?.status;

  return {
    approvalId,
    status,
    txId,
    toastId: getBridgeTransactionToastId({ approvalId, txId }),
    isPending: !status || status === SmartTransactionStatuses.PENDING,
    isSuccess: status === SmartTransactionStatuses.SUCCESS,
    isFailed:
      Boolean(status?.startsWith(SmartTransactionStatuses.CANCELLED)) ||
      (Boolean(status) &&
        status !== SmartTransactionStatuses.PENDING &&
        status !== SmartTransactionStatuses.SUCCESS),
  };
}

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

export function isEvmTransactionEligibleForToast(
  transaction: TransactionMeta,
  {
    bridgeApprovalIds,
    crossChainBridgeIds,
    requiredTransactionIds,
    requiredTransactionHashes,
  }: Record<string, Set<string>>,
) {
  const type = transaction?.type;
  if (typeof type !== 'string') {
    return false;
  }

  return (
    Boolean(type) &&
    !TOAST_EXCLUDED_TRANSACTION_TYPES.has(type) &&
    !bridgeApprovalIds.has(transaction.id?.toLowerCase?.() ?? '') &&
    !crossChainBridgeIds.has(transaction.id ?? '') &&
    !requiredTransactionIds.has(transaction.id ?? '') &&
    !(
      transaction.hash &&
      requiredTransactionHashes.has(transaction.hash.toLowerCase())
    )
  );
}

export function isNonEvmTransactionEligibleForToast(
  transaction: NonEvmToastTransaction,
  {
    currentAccountIds,
    enabledNonEvmChainIds,
    crossChainBridgeIds,
  }: NonEvmToastEligibilityCriteria,
) {
  const type = transaction?.type;
  if (
    typeof type !== 'string' ||
    !transaction?.id ||
    !transaction?.account ||
    !transaction?.chain
  ) {
    return false;
  }

  return (
    !TOAST_EXCLUDED_NON_EVM_TRANSACTION_TYPES.has(type) &&
    currentAccountIds.has(transaction.account) &&
    enabledNonEvmChainIds.has(transaction.chain) &&
    !crossChainBridgeIds.has(transaction.id)
  );
}

export const selectNonEvmToastEligibilityCriteria = createSelector(
  selectCurrentAccountIds,
  selectNonEvmChainIds,
  selectCrossChainBridgeSourceTxIds,
  (
    currentAccountIds,
    enabledNonEvmChainIds,
    crossChainBridgeIds,
  ): NonEvmToastEligibilityCriteria => ({
    // Non-EVM toasts should only reflect the currently selected account group.
    currentAccountIds: new Set(currentAccountIds),
    // Only enabled non-EVM networks should produce toasts.
    enabledNonEvmChainIds: new Set(enabledNonEvmChainIds),
    // Cross-chain bridge rows are handled by the bridge toast path instead.
    crossChainBridgeIds,
  }),
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
      return isEvmTransactionEligibleForToast(transaction, {
        bridgeApprovalIds,
        crossChainBridgeIds,
        requiredTransactionIds,
        requiredTransactionHashes,
      });
    });
  },
);

export const selectEvmToastEligibility = createSelector(
  selectBridgeApprovalTxIds,
  selectCrossChainBridgeSourceTxIds,
  selectRequiredTransactionIds,
  selectRequiredTransactionHashes,
  (
    bridgeApprovalIds,
    crossChainBridgeIds,
    requiredTransactionIds,
    requiredTransactionHashes,
  ) => ({
    bridgeApprovalIds,
    crossChainBridgeIds,
    requiredTransactionIds,
    requiredTransactionHashes,
  }),
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

export const selectBridgeSmartStatusToastStates = createSelector(
  getPendingApprovals,
  selectTxHistory,
  (pendingApprovals, txHistory): BridgeSmartStatusToastState[] =>
    pendingApprovals.flatMap((approval) => {
      // Only smart-status approvals can start the bridge pending toast from approval state.
      if (
        approval.type !==
        SMART_TRANSACTION_CONFIRMATION_TYPES.showSmartTransactionStatusPage
      ) {
        return EMPTY_ARRAY as unknown as BridgeSmartStatusToastState[];
      }

      const requestState = approval.requestState as
        | SmartStatusRequestState
        | undefined;
      // The smart-status approval must still map back to a real cross-chain bridge item.
      const bridgeHistoryItem = findBridgeHistoryItemForTxId(
        txHistory,
        requestState?.txId,
      );

      if (!bridgeHistoryItem?.quote) {
        return EMPTY_ARRAY as unknown as BridgeSmartStatusToastState[];
      }

      if (
        !isCrossChain(
          bridgeHistoryItem.quote.srcChainId,
          bridgeHistoryItem.quote.destChainId,
        )
      ) {
        return EMPTY_ARRAY as unknown as BridgeSmartStatusToastState[];
      }

      return [
        getBridgeSmartStatusToastState(
          approval.id,
          bridgeHistoryItem,
          requestState,
        ),
      ];
    }),
);

export const selectBridgeHistoryToastStates = createSelector(
  selectTxHistory,
  (txHistory): BridgeHistoryToastState[] =>
    Object.values(txHistory).flatMap((bridgeHistoryItem) => {
      // Bridge history is the durable source for terminal bridge status updates.
      if (
        !bridgeHistoryItem.quote ||
        !isCrossChain(
          bridgeHistoryItem.quote.srcChainId,
          bridgeHistoryItem.quote.destChainId,
        )
      ) {
        return EMPTY_ARRAY as BridgeHistoryToastState[];
      }

      // Toast identity follows the source transaction id so pending and completion update the same toast.
      const txId =
        bridgeHistoryItem.originalTransactionId ?? bridgeHistoryItem.txMetaId;

      if (!txId) {
        return EMPTY_ARRAY as BridgeHistoryToastState[];
      }

      return [
        {
          // approvalTxId only matters as a fallback id source when there is no better transaction id.
          toastId: getBridgeTransactionToastId({
            approvalId: bridgeHistoryItem.approvalTxId ?? txId,
            txId,
          }),
          txId,
          status: bridgeHistoryItem.status?.status,
          isSuccess: isBridgeComplete(bridgeHistoryItem),
          isFailed: bridgeHistoryItem.status?.status === StatusTypes.FAILED,
        },
      ];
    }),
);
