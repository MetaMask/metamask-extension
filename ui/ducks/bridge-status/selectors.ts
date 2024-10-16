import { createSelector } from 'reselect';
import { BridgeStatusControllerState } from '../../../app/scripts/controllers/bridge-status/types';

export type BridgeStatusAppState = {
  metamask: {
    bridgeStatusState: BridgeStatusControllerState;
  };
};

export const selectBridgeStatusState = (state: BridgeStatusAppState) =>
  state.metamask.bridgeStatusState;

export const selectBridgeTxStatuses = createSelector(
  [
    selectBridgeStatusState,
    (_: BridgeStatusAppState, txHash: string) => txHash,
  ],
  (bridgeStatusState) => bridgeStatusState.txStatuses,
);
