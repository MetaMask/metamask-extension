import { createSelector } from 'reselect';
import { createDeepEqualSelector } from '../util';

export type DevicesMetaMaskState = {
  metamask: {
    devices: Record<string, any>;
    pairing: { snapId: string; type: any; filters?: any[] } | null;
  };
};

function getDevicePairingState(state: DevicesMetaMaskState) {
  console.log(state.metamask.pairing);
  return state.metamask.pairing;
}

function getPairedDevicesState(state: DevicesMetaMaskState) {
  return state.metamask.devices;
}

export const getPairedDevices = createDeepEqualSelector(
  getPairedDevicesState,
  (devices) => Object.values(devices),
);

export const getDevicePairing = createDeepEqualSelector(
  getDevicePairingState,
  (_state: DevicesMetaMaskState, snapId: string) => snapId,
  (pairing, snapId) => (pairing?.snapId === snapId ? pairing : null),
);

export const getAnyDevicePairing = createDeepEqualSelector(
  getDevicePairingState,
  (pairing) => pairing,
);
