import * as actionConstants from '../../store/actionConstants';
import { ALERT_STATE } from './enums';
import reducer, {
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
} from './unconnected-account-slice';

describe('unconnectedAccountSlice', () => {
  const initialState = {
    state: ALERT_STATE.CLOSED,
  };

  describe('initial state', () => {
    it('returns the initial state', () => {
      expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });
  });

  describe('connectAccount actions', () => {
    it('sets state to ERROR on connectAccountFailed', () => {
      const result = reducer(initialState, connectAccountFailed());

      expect(result.state).toBe(ALERT_STATE.ERROR);
    });

    it('sets state to LOADING on connectAccountRequested', () => {
      const result = reducer(initialState, connectAccountRequested());

      expect(result.state).toBe(ALERT_STATE.LOADING);
    });

    it('sets state to CLOSED on connectAccountSucceeded', () => {
      const openState = { state: ALERT_STATE.OPEN };
      const result = reducer(openState, connectAccountSucceeded());

      expect(result.state).toBe(ALERT_STATE.CLOSED);
    });
  });

  describe('disableAlert actions', () => {
    it('sets state to ERROR on disableAlertFailed', () => {
      const result = reducer(initialState, disableAlertFailed());

      expect(result.state).toBe(ALERT_STATE.ERROR);
    });

    it('sets state to LOADING on disableAlertRequested', () => {
      const result = reducer(initialState, disableAlertRequested());

      expect(result.state).toBe(ALERT_STATE.LOADING);
    });

    it('sets state to CLOSED on disableAlertSucceeded', () => {
      const openState = { state: ALERT_STATE.OPEN };
      const result = reducer(openState, disableAlertSucceeded());

      expect(result.state).toBe(ALERT_STATE.CLOSED);
    });
  });

  describe('dismissAlert', () => {
    it('sets state to CLOSED', () => {
      const openState = { state: ALERT_STATE.OPEN };
      const result = reducer(openState, dismissAlert());

      expect(result.state).toBe(ALERT_STATE.CLOSED);
    });
  });

  describe('switchAccount actions', () => {
    it('sets state to ERROR on switchAccountFailed', () => {
      const result = reducer(initialState, switchAccountFailed());

      expect(result.state).toBe(ALERT_STATE.ERROR);
    });

    it('sets state to LOADING on switchAccountRequested', () => {
      const result = reducer(initialState, switchAccountRequested());

      expect(result.state).toBe(ALERT_STATE.LOADING);
    });

    it('sets state to CLOSED on switchAccountSucceeded', () => {
      const openState = { state: ALERT_STATE.OPEN };
      const result = reducer(openState, switchAccountSucceeded());

      expect(result.state).toBe(ALERT_STATE.CLOSED);
    });
  });

  describe('switchedToUnconnectedAccount', () => {
    it('sets state to OPEN', () => {
      const result = reducer(initialState, switchedToUnconnectedAccount());

      expect(result.state).toBe(ALERT_STATE.OPEN);
    });
  });

  describe('extraReducers', () => {
    it('closes alert on SELECTED_ADDRESS_CHANGED when state is OPEN', () => {
      const openState = { state: ALERT_STATE.OPEN };
      const result = reducer(openState, {
        type: actionConstants.SELECTED_ADDRESS_CHANGED,
      });

      expect(result.state).toBe(ALERT_STATE.CLOSED);
    });

    it('does not change state on SELECTED_ADDRESS_CHANGED when state is not OPEN', () => {
      const loadingState = { state: ALERT_STATE.LOADING };
      const result = reducer(loadingState, {
        type: actionConstants.SELECTED_ADDRESS_CHANGED,
      });

      expect(result.state).toBe(ALERT_STATE.LOADING);
    });

    it('does not change state on SELECTED_ADDRESS_CHANGED when state is CLOSED', () => {
      const result = reducer(initialState, {
        type: actionConstants.SELECTED_ADDRESS_CHANGED,
      });

      expect(result.state).toBe(ALERT_STATE.CLOSED);
    });
  });
});
