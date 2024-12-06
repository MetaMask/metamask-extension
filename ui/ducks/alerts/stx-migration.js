import { createSlice } from '@reduxjs/toolkit';
import { captureException } from '@sentry/browser';
import { AlertTypes } from '../../../shared/constants/alerts';
import { setAlertEnabledness } from '../../store/actions';
import * as actionConstants from '../../store/actionConstants';
import { ALERT_STATE } from './enums';

const name = AlertTypes.stxMigration;

const initialState = {
  state: ALERT_STATE.CLOSED,
};

const slice = createSlice({
  name,
  initialState,
  reducers: {
    disableAlertRequested: (state) => {
      state.state = ALERT_STATE.LOADING;
    },
    disableAlertSucceeded: (state) => {
      state.state = ALERT_STATE.CLOSED;
    },
    disableAlertFailed: (state) => {
      state.state = ALERT_STATE.ERROR;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(actionConstants.UPDATE_METAMASK_STATE, (state, action) => {
      if (
        action.value?.preferences?.smartTransactionsOptInStatus === true &&
        action.value?.alertEnabledness?.[AlertTypes.stxMigration] !== false
      ) {
        state.state = ALERT_STATE.OPEN;
      }
    });
  },
});

const { actions, reducer } = slice;

export const stxAlertIsOpen = (state) =>
  state[name]?.state === ALERT_STATE.OPEN;

export const {
  showSTXMigrationAlert,
  dismissSTXMigrationAlert,
  disableAlertRequested,
  disableAlertSucceeded,
  disableAlertFailed,
} = actions;

export const dismissAndDisableAlert = () => {
  return async (dispatch) => {
    try {
      // Show loading state
      await dispatch(disableAlertRequested());
      // Set alert enabledness to false (persistent setting)
      await setAlertEnabledness(AlertTypes.stxMigration, false);
      // Mark alert as successfully disabled
      await dispatch(disableAlertSucceeded());
    } catch (error) {
      console.error('Failed to disable STX Migration alert:', error);
      captureException(error);
      // Show an error state
      await dispatch(disableAlertFailed());
    }
  };
};

export default reducer;
