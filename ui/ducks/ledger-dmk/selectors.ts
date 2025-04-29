import type { LedgerDmkState } from './ledger-dmk';

export const getLedgerConnectedDevice = (state: LedgerDmkState) =>
  state.connectedDevice;

export const getLedgerDeviceStatus = (state: LedgerDmkState) =>
  state.deviceStatus;

export const getLedgerEthSigner = (state: LedgerDmkState) => state.ethSigner;

export const getLedgerDmk = (state: LedgerDmkState) => state.dmk;

export const getLedgerSessionId = (state: LedgerDmkState) => state.sessionId;

export const getLedgerTransportType = (state: LedgerDmkState) =>
  state.transportType;
