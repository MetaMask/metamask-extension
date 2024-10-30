import { createSelector } from 'reselect';
import { Hex } from '@metamask/utils';
import {
  BridgeHistoryItem,
  BridgeStatusControllerState,
} from '../../../app/scripts/controllers/bridge-status/types';
import { getCurrentChainId, getSelectedAddress } from '../../selectors';
import { Numeric } from '../../../shared/modules/Numeric';

export type BridgeStatusAppState = {
  metamask: {
    bridgeStatusState: BridgeStatusControllerState;
  };
};

export const selectBridgeStatusState = (state: BridgeStatusAppState) =>
  state.metamask.bridgeStatusState;

/**
 * Returns a mapping of srctxHash to txHistoryItem for the selected address
 */
export const selectBridgeHistoryForAccount = createSelector(
  [getSelectedAddress, selectBridgeStatusState],
  (selectedAddress, bridgeStatusState) => {
    const { txHistory } = bridgeStatusState;

    return Object.keys(txHistory).reduce<Record<string, BridgeHistoryItem>>(
      (acc, txHash) => {
        const txHistoryItem = txHistory[txHash];
        if (txHistoryItem.account === selectedAddress) {
          acc[txHash] = txHistoryItem;
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
  [selectBridgeHistoryForAccount, getCurrentChainId],
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
