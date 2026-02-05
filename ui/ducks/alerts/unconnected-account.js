import { captureException } from '../../../shared/lib/sentry';
import { AlertTypes } from '../../../shared/constants/alerts';
import {
  addPermittedAccount,
  setAlertEnabledness,
  setSelectedAccount,
  setSelectedInternalAccount,
} from '../../store/actions';
import {
  getInternalAccount,
  getOriginOfCurrentTab,
  getSelectedInternalAccount,
} from '../../selectors';
import {
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

export { dismissAlert, switchedToUnconnectedAccount };

const name = AlertTypes.unconnectedAccount;

// Selectors

export const getAlertState = (state) => state[name].state;

// Thunk actions

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

export const switchToAccount = (accountId) => {
  return async (dispatch, getState) => {
    const state = getState();
    try {
      await dispatch(switchAccountRequested());
      await dispatch(setSelectedInternalAccount(accountId));
      const internalAccount = getInternalAccount(state, accountId);
      await dispatch(setSelectedAccount(internalAccount.address));
      await dispatch(switchAccountSucceeded());
    } catch (error) {
      console.error(error);
      captureException(error);
      await dispatch(switchAccountFailed());
    }
  };
};

export const connectAccount = () => {
  return async (dispatch, getState) => {
    const state = getState();
    const { address: selectedAddress } = getSelectedInternalAccount(state);
    const origin = getOriginOfCurrentTab(state);
    try {
      await dispatch(connectAccountRequested());
      await dispatch(addPermittedAccount(origin, selectedAddress));
      await dispatch(connectAccountSucceeded());
    } catch (error) {
      console.error(error);
      captureException(error);
      await dispatch(connectAccountFailed());
    }
  };
};
