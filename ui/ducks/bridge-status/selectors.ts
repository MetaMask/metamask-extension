import { createSelector } from 'reselect';
import { Hex } from '@metamask/utils';
import {
  BridgeStatusState,
  BridgeHistoryItem,
} from '../../../shared/types/bridge-status';
import { getSelectedAddress } from '../../selectors';
import { Numeric } from '../../../shared/modules/Numeric';
import {
  getCurrentChainId,
  ProviderConfigState,
} from '../../../shared/modules/selectors/networks';

export type BridgeStatusAppState = ProviderConfigState & {
  metamask: {
    bridgeStatusState: BridgeStatusState;
  };
};

export const selectBridgeStatusState = (state: BridgeStatusAppState) =>
  state.metamask.bridgeStatusState;

/**
 * Returns a mapping of srcTxMetaId to txHistoryItem for the selected address
 */
export const selectBridgeHistoryForAccount = createSelector(
  [getSelectedAddress, selectBridgeStatusState],
  (selectedAddress, bridgeStatusState) => {
    const { txHistory } = bridgeStatusState;

    return Object.keys(txHistory).reduce<Record<string, BridgeHistoryItem>>(
      (acc, txMetaId) => {
        const txHistoryItem = txHistory[txMetaId];
        if (txHistoryItem.account === selectedAddress) {
          acc[txMetaId] = txHistoryItem;
        }
        return acc;
      },
      {},
    );
  },
);

/**
 * Returns an array of sorted bridge history items for when the user's current chain is the destination chain for a bridge tx
 */
export const selectIncomingBridgeHistory = createSelector(
  selectBridgeHistoryForAccount,
  getCurrentChainId,
  (bridgeHistory, currentChainId) => {
    // Get all history items with dest chain that matches current chain
    return Object.values(bridgeHistory)
      .filter((bridgeHistoryItem) => {
        const hexDestChainId = new Numeric(
          bridgeHistoryItem.quote.destChainId,
          10,
        ).toPrefixedHexString() as Hex;

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
