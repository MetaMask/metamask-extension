import { DeviceManagementKit } from '@ledgerhq/device-management-kit';
import { createSlice } from '@reduxjs/toolkit';
import { type BLE, WEBHID } from './constants';

export type LedgerDmkState = {
  dmk: DeviceManagementKit;
  transportType: typeof WEBHID | typeof BLE;
  ethSigner: unknown;
  connectedDevice: unknown;
  deviceStatus: unknown;
  sessionId: string | undefined;
};

const initialState = {
  dmk: DeviceManagementKit,
  transportType: WEBHID,
  ethSigner: undefined,
  connectedDevice: undefined,
  deviceStatus: undefined,
  sessionId: undefined,
};

const ledgerDmkSlice = createSlice({
  name: 'ledgerDmk',
  initialState,
  reducers: {
    setConnectedDevice: (state, action) => {
      state.connectedDevice = action.payload;
    },
    setDeviceStatus: (state, action) => {
      state.deviceStatus = action.payload;
    },
    setDmk: (state, action) => {
      state.dmk = action.payload;
    },
    setSessionId: (state, action) => {
      state.sessionId = action.payload;
    },
    setEthSigner: (state, action) => {
      state.ethSigner = action.payload;
    },
    setTransportType: (state, action) => {
      state.transportType = action.payload;
    },
  },
});

export const {
  setConnectedDevice,
  setDeviceStatus,
  setEthSigner,
  setDmk,
  setSessionId,
  setTransportType,
} = ledgerDmkSlice.actions;

export default ledgerDmkSlice.reducer;
