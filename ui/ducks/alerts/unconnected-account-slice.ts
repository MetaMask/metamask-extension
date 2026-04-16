import { createSlice } from '@reduxjs/toolkit';
import { AlertTypes } from '../../../shared/constants/alerts';
import * as actionConstants from '../../store/actionConstants';
import { ALERT_STATE } from './enums';

const initialState = {
  state: ALERT_STATE.CLOSED,
};

export const unconnectedAccountSlice = createSlice({
  name: AlertTypes.unconnectedAccount,
  initialState,
  reducers: {
    connectAccountFailed: (state) => {
      state.state = ALERT_STATE.ERROR;
    },
    connectAccountRequested: (state) => {
      state.state = ALERT_STATE.LOADING;
    },
    connectAccountSucceeded: (state) => {
      state.state = ALERT_STATE.CLOSED;
    },
    disableAlertFailed: (state) => {
      state.state = ALERT_STATE.ERROR;
    },
    disableAlertRequested: (state) => {
      state.state = ALERT_STATE.LOADING;
    },
    disableAlertSucceeded: (state) => {
      state.state = ALERT_STATE.CLOSED;
    },
    dismissAlert: (state) => {
      state.state = ALERT_STATE.CLOSED;
    },
    switchAccountFailed: (state) => {
      state.state = ALERT_STATE.ERROR;
    },
    switchAccountRequested: (state) => {
      state.state = ALERT_STATE.LOADING;
    },
    switchAccountSucceeded: (state) => {
      state.state = ALERT_STATE.CLOSED;
    },
    switchedToUnconnectedAccount: (state) => {
      state.state = ALERT_STATE.OPEN;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(actionConstants.SELECTED_ADDRESS_CHANGED, (state) => {
      // close the alert if the account is switched while it's open
      if (state.state === ALERT_STATE.OPEN) {
        state.state = ALERT_STATE.CLOSED;
      }
    });
  },
});

// Action creators are generated for each case reducer function
export const {
  connectAccountFailed,
  connectAccountRequested,
  connectAccountSucceeded,
  disableAlertFailed,
  disableAlertRequested,
  disableAlertSucceeded,
  dismissAlert,
  switchAccountFailed,
  switchAccountRequested,
  switchAccountSucceeded,
  switchedToUnconnectedAccount,
} = unconnectedAccountSlice.actions;

export default unconnectedAccountSlice.reducer;
