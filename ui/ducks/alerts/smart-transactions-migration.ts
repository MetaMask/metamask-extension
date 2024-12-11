import { createSlice, Action, Dispatch } from '@reduxjs/toolkit';
import { captureException } from '@sentry/browser';
import { AlertTypes } from '../../../shared/constants/alerts';
import { setAlertEnabledness } from '../../store/actions';
import * as actionConstants from '../../store/actionConstants';
import { ALERT_STATE } from './enums';

const name = AlertTypes.smartTransactionsMigration;

const initialState = {
  state: ALERT_STATE.CLOSED,
};

type MetaMaskStateAction = Action<
  typeof actionConstants.UPDATE_METAMASK_STATE
> & {
  value: {
    preferences?: { smartTransactionsOptInStatus?: boolean };
    alertEnabledness?: { [key: string]: boolean };
  };
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
    builder.addCase(
      actionConstants.UPDATE_METAMASK_STATE,
      (state, action: MetaMaskStateAction) => {
        if (
          action.value?.preferences?.smartTransactionsOptInStatus === true &&
          action.value?.alertEnabledness?.[
            AlertTypes.smartTransactionsMigration
          ] !== false
        ) {
          state.state = ALERT_STATE.OPEN;
        }
      },
    );
  },
});

const { actions, reducer } = slice;

type RootState = {
  [name]: typeof initialState;
};

export const shouldShowSmartTransactionsMigrationAlert = (state: RootState) =>
  state[name]?.state === ALERT_STATE.OPEN;

export const {
  disableAlertRequested,
  disableAlertSucceeded,
  disableAlertFailed,
} = actions;

export const dismissAndDisableAlert = () => {
  return async (dispatch: Dispatch) => {
    try {
      // Show loading state
      await dispatch(disableAlertRequested());
      // Set alert enabledness to false (persistent setting)
      await setAlertEnabledness(AlertTypes.smartTransactionsMigration, false);
      // Mark alert as successfully disabled
      await dispatch(disableAlertSucceeded());
    } catch (error) {
      console.error(
        'Failed to disable Smart Transactions Migration alert:',
        error,
      );
      captureException(error);
      // Show an error state
      await dispatch(disableAlertFailed());
    }
  };
};

export default reducer;
