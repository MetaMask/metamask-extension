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
      state.state = ALERT_STATE.CLOSED;
    },
  },
  extraReducers: {
    [actionConstants.UPDATE_METAMASK_STATE]: (state, action) => {
      console.log('=== STX ALERT REDUCER ===');
      console.log('Current state:', state.state);
      console.log('Action:', action.type);
      console.log('Action value:', action.value);
      console.log(
        'STX status:',
        action.value?.preferences?.smartTransactionsOptInStatus,
      );
      if (action.value?.preferences?.smartTransactionsOptInStatus === true) {
        state.state = ALERT_STATE.OPEN;
        console.log('Alert state changed to:', ALERT_STATE.OPEN);
      }
      console.log('=== STX ALERT REDUCER END ===');
    },
  },
});

const { actions, reducer } = slice;

// Selectors
export const getSTXAlertState = (state) => state.metamask.alerts?.[name]?.state;
export const stxAlertIsOpen = (state) =>
  state.metamask.alerts?.[name]?.state === ALERT_STATE.OPEN;

// Actions
export const { showSTXMigrationAlert, dismissSTXMigrationAlert } = actions;

export default reducer;
