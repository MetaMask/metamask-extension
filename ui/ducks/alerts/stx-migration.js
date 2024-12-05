import { createSlice } from '@reduxjs/toolkit';
import { AlertTypes } from '../../../shared/constants/alerts';
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
      console.log('Dismiss action received in reducer');
      state.state = ALERT_STATE.CLOSED;
      console.log('State updated to:', state.state);
    },
  },
  extraReducers: {
    [actionConstants.UPDATE_METAMASK_STATE]: (state, action) => {
      console.log('=== STX REDUCER ===');
      console.log('STX Alert State:', state?.state);
      if (action.value?.preferences?.smartTransactionsOptInStatus === true) {
        state.state = ALERT_STATE.OPEN;
        console.log('Alert state changed to:', ALERT_STATE.OPEN);
      }
      console.log('=== STX REDUCER END ===');
    },
  },
});

const { actions, reducer } = slice;

// Selectors
export const getSTXAlertState = (state) => state.metamask.alerts?.[name]?.state;
export const stxAlertIsOpen = (state) =>
  state.stxMigration?.state === ALERT_STATE.OPEN;

// Actions
export const { showSTXMigrationAlert, dismissSTXMigrationAlert } = actions;

export default reducer;
