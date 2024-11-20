import { createSlice } from '@reduxjs/toolkit';
import { AlertTypes } from '../../../shared/constants/alerts';
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
});

const { actions, reducer } = slice;

export default reducer;

// Selectors
export const getSTXAlertState = (state) => state[name].state;
export const stxAlertIsOpen = (state) => state[name].state === ALERT_STATE.OPEN;

// Actions
export const { showSTXMigrationAlert, dismissSTXMigrationAlert } = actions;
