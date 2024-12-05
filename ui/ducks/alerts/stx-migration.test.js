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
    showSTXMigrationAlert: (state) => {
      state.state = ALERT_STATE.OPEN;
    },
    dismissSTXMigrationAlert: (state) => {
      state.state = ALERT_STATE.CLOSED;
    },
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
  extraReducers: {
    [actionConstants.UPDATE_METAMASK_STATE]: (state, action) => {
      if (action.value?.preferences?.smartTransactionsOptInStatus === true) {
        state.state = ALERT_STATE.OPEN;
      }
    },
  },
});

const { actions, reducer } = slice;

export const getSTXAlertState = (state) => state[name]?.state;
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
      await dispatch(disableAlertRequested());
      await setAlertEnabledness(name, false);
      await dispatch(disableAlertSucceeded());
    } catch (error) {
      console.error(error);
      captureException(error);
      await dispatch(disableAlertFailed());
    }
  };
};
