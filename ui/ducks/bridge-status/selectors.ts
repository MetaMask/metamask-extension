import { createSelector } from 'reselect';
import {
  BridgeHistoryItem,
  BridgeStatusControllerState,
} from '../../../app/scripts/controllers/bridge-status/types';
import { getSelectedAddress } from '../../selectors';

export type BridgeStatusAppState = {
  metamask: {
    bridgeStatusState: BridgeStatusControllerState;
  };
};

export const selectBridgeStatusState = (state: BridgeStatusAppState) =>
  state.metamask.bridgeStatusState;

/**
 * Returns a mapping of txHash to txHistoryItem for the selected address
 */
export const selectBridgeTxHistory = createSelector(
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
