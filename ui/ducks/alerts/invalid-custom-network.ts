import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { AlertTypes } from '../../../shared/constants/alerts';
import type { MetaMaskReduxState } from '../../store/store';
import { ALERT_STATE, type AlertState } from './enums';

const name = AlertTypes.invalidCustomNetwork;

type InvalidCustomNetworkState = {
  state: AlertState;
  networkName: string;
};

const initialState: InvalidCustomNetworkState = {
  state: ALERT_STATE.CLOSED,
  networkName: '',
};

const slice = createSlice({
  name,
  initialState,
  reducers: {
    openAlert: (state, action: PayloadAction<string>) => {
      state.state = ALERT_STATE.OPEN;
      state.networkName = action.payload;
    },
    dismissAlert: (state) => {
      state.state = ALERT_STATE.CLOSED;
      state.networkName = '';
    },
  },
});

const { actions, reducer } = slice;

export default reducer;

export const getAlertState = (state: MetaMaskReduxState): AlertState =>
  state[name].state;

export const getNetworkName = (state: MetaMaskReduxState): string =>
  state[name].networkName;

export const alertIsOpen = (state: MetaMaskReduxState): boolean =>
  state[name].state !== ALERT_STATE.CLOSED;

const { openAlert, dismissAlert } = actions;

export { openAlert, dismissAlert };
