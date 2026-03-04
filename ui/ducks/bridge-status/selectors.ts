import { createSelector } from 'reselect';
import type {
  BridgeHistoryItem,
  BridgeStatusControllerState,
} from '@metamask/bridge-status-controller';
import { type TransactionControllerState } from '@metamask/transaction-controller';
import { Numeric } from '../../../shared/modules/Numeric';
import { getCurrentChainId } from '../../../shared/modules/selectors/networks';
import { getSwapsTokensReceivedFromTxMeta } from '../../../shared/lib/transactions-controller-utils';
import {
  getInternalAccountsFromGroupById,
  getSelectedAccountGroup,
} from '../../selectors/multichain-accounts/account-tree';

type BridgeStatusAppState = {
  metamask: BridgeStatusControllerState & TransactionControllerState;
};

type BridgeHistoryItemWithOriginalTransactionId = BridgeHistoryItem & {
  originalTransactionId?: string;
};

const selectBridgeHistory = (state: BridgeStatusAppState) =>
  state.metamask.txHistory;

const selectBridgeHistoryForAccount = createSelector(
  [(_, selectedAddresses?: string[]) => selectedAddresses, selectBridgeHistory],
  (selectedAddresses, txHistory) => {
    if (!selectedAddresses || selectedAddresses.length === 0) {
      return txHistory;
    }

    return Object.keys(txHistory).reduce<Record<string, BridgeHistoryItem>>(
      (acc, txMetaId) => {
        const txHistoryItem = txHistory[txMetaId];
        if (selectedAddresses.includes(txHistoryItem.account)) {
          acc[txMetaId] = txHistoryItem;
        }
        return acc;
      },
      {},
    );
  },
);

/**
 * Returns a mapping of srcTxMetaId to txHistoryItem for the selected address
 * If no address is provided, return all bridge history items for all addresses
 *
 * @param state - the state object
 * @returns A mapping of srcTxMetaId to txHistoryItem for the selected address
 */
export const selectBridgeHistoryForAccountGroup = createSelector(
  [selectBridgeHistory, getSelectedAccountGroup, (state) => state],
  (txHistory, selectedAccountGroup, state) => {
    if (!selectedAccountGroup) {
      return txHistory;
    }
    const internalAccountAddresses = getInternalAccountsFromGroupById(
      state,
      selectedAccountGroup,
    ).map((internalAccount) => internalAccount.address);

    return selectBridgeHistoryForAccount(state, internalAccountAddresses);
  },
);

// eslint-disable-next-line jsdoc/require-param
/**
 * @deprecated use selectBridgeHistoryItemForTransactionHash instead
 */
export const selectBridgeHistoryItemForTxMetaId = createSelector(
  [selectBridgeHistory, (_, txMetaId?: string) => txMetaId],
  (bridgeHistory, txMetaId) => {
    if (!txMetaId) {
      return undefined;
    }
    return bridgeHistory[txMetaId];
  },
);

const selectBridgeHistoryByOriginalTransactionId = createSelector(
  [selectBridgeHistory],
  (bridgeHistory) =>
    Object.values(bridgeHistory).reduce<
      Record<string, BridgeHistoryItemWithOriginalTransactionId>
    >((acc, bridgeHistoryItem: BridgeHistoryItemWithOriginalTransactionId) => {
      if (bridgeHistoryItem.originalTransactionId) {
        acc[bridgeHistoryItem.originalTransactionId] = bridgeHistoryItem;
      }
      return acc;
    }, {}),
);

const selectBridgeHistoryByApprovalTxId = createSelector(
  [selectBridgeHistory],
  (bridgeHistory) =>
    Object.values(bridgeHistory).reduce<Record<string, BridgeHistoryItem>>(
      (acc, bridgeHistoryItem) => {
        if (bridgeHistoryItem.approvalTxId) {
          acc[bridgeHistoryItem.approvalTxId.toLowerCase()] = bridgeHistoryItem;
        }
        return acc;
      },
      {},
    ),
);

// eslint-disable-next-line jsdoc/require-param
/**
 * Returns a bridge history item for a given original tx meta id.
 * Used by intent flows where txHistory key is orderUid and tx meta id is stored separately.
 */
export const selectBridgeHistoryForOriginalTxMetaId = (
  state: BridgeStatusAppState,
  originalTxMetaId?: string,
) => {
  if (!originalTxMetaId) {
    return undefined;
  }

  return selectBridgeHistoryByOriginalTransactionId(state)[originalTxMetaId];
};

// eslint-disable-next-line jsdoc/require-param
/**
 * Returns a bridge history item for a given approval tx id
 */
export const selectBridgeHistoryForApprovalTxId = (
  state: BridgeStatusAppState,
  approvalTxId?: string,
) => {
  if (!approvalTxId) {
    return undefined;
  }

  return selectBridgeHistoryByApprovalTxId(state)[approvalTxId.toLowerCase()];
};

/**
 * Returns a pending/local transaction for the given tx hash
 *
 * @param state - the metamask state
 * @param txHash - the tx hash
 * @returns the pending/local transaction for the given tx hash
 */
export const selectLocalTxForTxHash = (
  state: BridgeStatusAppState,
  txHash?: string,
) =>
  txHash
    ? state.metamask.transactions.find(
        (transaction) =>
          transaction.hash?.toLowerCase() === txHash?.toLowerCase(),
      )
    : undefined;

/**
 * Returns the local bridge history details for the given tx hash
 *
 * @param _state - the metamask state
 * @param txHash - the tx hash
 * @returns the bridge history item for the given tx hash
 */
const selectBridgeHistoryItemForTxHash = createSelector(
  [
    selectBridgeHistory,
    selectLocalTxForTxHash,
    (_state: BridgeStatusAppState, txHash) => txHash,
  ],
  (bridgeHistory, tx, txHash) => {
    // Non-EVM transactions use the tx hash as the key
    if (txHash && bridgeHistory[txHash]) {
      return bridgeHistory[txHash];
    }

    const txId = tx?.id;
    const actionId = tx?.actionId;
    if (txId && bridgeHistory[txId]) {
      return bridgeHistory[txId];
    }
    if (actionId && bridgeHistory[actionId]) {
      return bridgeHistory[actionId];
    }
    return undefined;
  },
);

/**
 * Returns a local bridge history item that includes the given approval tx hash
 *
 * @param state - the metamask state
 * @param txHash - the tx hash
 * @returns the bridge history item that includes the given approval tx hash
 */
const selectBridgeHistoryItemForApprovalTxHash = createSelector(
  [selectBridgeHistory, selectLocalTxForTxHash],
  (bridgeHistory, tx) => {
    const approvalTxId = tx?.id;
    if (!approvalTxId) {
      return undefined;
    }
    return Object.values(bridgeHistory).find(
      (bridgeHistoryItem) =>
        bridgeHistoryItem.approvalTxId?.toLowerCase() ===
        approvalTxId.toLowerCase(),
    );
  },
);

/**
 * Returns a local bridge history item that includes the given trade, approval or non-evm tx hash
 *
 * @param state - the metamask state
 * @param txHash - the tx hash
 * @returns the bridge history item that includes the given approval tx hash
 */
export const selectBridgeHistoryItemByHash = createSelector(
  [selectBridgeHistoryItemForTxHash, selectBridgeHistoryItemForApprovalTxHash],
  (tradeHistoryItem, approvalHistoryItem) => {
    return approvalHistoryItem ?? tradeHistoryItem;
  },
);

export const selectReceivedSwapsTokenAmountFromTxMeta = createSelector(
  [
    selectBridgeHistoryItemForTxMetaId,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    (_, __, txMeta) => txMeta,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    (_, __, ___, approvalTxMeta) => approvalTxMeta,
  ],
  (bridgeHistoryItem, txMeta, approvalTxMeta) => {
    if (!bridgeHistoryItem) {
      return null;
    }
    const {
      quote: { destAsset },
      account,
    } = bridgeHistoryItem;

    return getSwapsTokensReceivedFromTxMeta(
      destAsset.symbol,
      txMeta,
      destAsset.address,
      account,
      destAsset.decimals,
      approvalTxMeta,
      destAsset.chainId,
    );
  },
);

/**
 * Returns an array of sorted bridge history items for when the user's current chain is the destination chain for a bridge tx
 */
export const selectIncomingBridgeHistory = createSelector(
  selectBridgeHistoryForAccountGroup,
  getCurrentChainId,
  (bridgeHistory, currentChainId) => {
    // Get all history items with dest chain that matches current chain
    return Object.values(bridgeHistory)
      .filter((bridgeHistoryItem) => {
        const hexDestChainId = new Numeric(
          bridgeHistoryItem.quote.destChainId,
          10,
        ).toPrefixedHexString();

        return hexDestChainId === currentChainId;
      })
      .sort((a, b) => {
        if (a.startTime && b.startTime) {
          return b.startTime - a.startTime;
        }
        return 0;
      });
  },
);
