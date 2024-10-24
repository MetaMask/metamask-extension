import { ApprovalControllerState } from '@metamask/approval-controller';
import { ApprovalType } from '@metamask/controller-utils';
import { createSelector } from 'reselect';
import { createDeepEqualSelector } from './util';

export type DevicesMetaMaskState = {
  metamask: {
    devices: Record<string, any>;
    pairing: { snapId: string | null };
  };
};

function getDevicePairingState(state: DevicesMetaMaskState) {
  console.log(state.metamask.pairing);
  return state.metamask.pairing;
}

function getPairedDevicesState(state: DevicesMetaMaskState) {
  return state.metamask.devices;
}

export const getPairedDevices = createSelector(
  getPairedDevicesState,
  (devices) => Object.values(devices),
);

export const hasDevicePairing = createSelector(
  getDevicePairingState,
  (_state: DevicesMetaMaskState, snapId: string) => snapId,
  (pairing, snapId) => pairing?.snapId === snapId,
);

export const hasAnyDevicePairing = createSelector(
  getDevicePairingState,
  (pairing) => pairing !== undefined,
);
