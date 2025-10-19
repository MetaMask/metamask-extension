import { createSelector } from 'reselect';
import { type BridgeHistoryItem } from '@metamask/bridge-status-controller';
import { Numeric } from '../../../shared/modules/Numeric';
import { getCurrentChainId } from '../../../shared/modules/selectors/networks';
import { type BridgeStatusAppState } from '../../../shared/types/bridge-status';
import { getSwapsTokensReceivedFromTxMeta } from '../../../shared/lib/transactions-controller-utils';
import {
  getInternalAccountsFromGroupById,
  getSelectedAccountGroup,
} from '../../selectors/multichain-accounts/account-tree';

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

export const selectBridgeHistoryItemForTxMetaId = createSelector(
  [selectBridgeHistory, (_, txMetaId?: string) => txMetaId],
  (bridgeHistory, txMetaId) => {
    if (!txMetaId) {
      return undefined;
    }
    return bridgeHistory[txMetaId];
  },
);

// eslint-disable-next-line jsdoc/require-param
/**
 * Returns a bridge history item for a given approval tx id
 */
export const selectBridgeHistoryForApprovalTxId = createSelector(
  [selectBridgeHistory, (_, approvalTxId: string) => approvalTxId],
  (bridgeHistory, approvalTxId) => {
    return Object.values(bridgeHistory).find(
      (bridgeHistoryItem) => bridgeHistoryItem.approvalTxId === approvalTxId,
    );
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
