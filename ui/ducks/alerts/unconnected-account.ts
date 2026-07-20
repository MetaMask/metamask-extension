import type { AnyAction } from 'redux';
import type { ThunkAction } from 'redux-thunk';

import { captureException } from '../../../shared/lib/sentry';
import { AlertTypes } from '../../../shared/constants/alerts';
import {
  addPermittedAccount,
  setAlertEnabledness,
  setSelectedAccount,
  setSelectedInternalAccount,
} from '../../store/actions';
import { getInternalAccount, getOriginOfCurrentTab } from '../../selectors';
import { getSelectedInternalAccount } from '../../../shared/lib/selectors/accounts';
import type { MetaMaskReduxDispatch, MetaMaskReduxState } from '../../store/store';
import type { AlertState } from './enums';
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

export const getAlertState = (state: MetaMaskReduxState): AlertState =>
  state[name].state;

type MetaMaskThunk<ReturnValue = void> = ThunkAction<
  Promise<ReturnValue>,
  MetaMaskReduxState,
  unknown,
  AnyAction
>;

export const dismissAndDisableAlert = (): MetaMaskThunk => {
  return async (dispatch: MetaMaskReduxDispatch) => {
    try {
      await dispatch(disableAlertRequested());
      await setAlertEnabledness(name, false);
      await dispatch(disableAlertSucceeded());
    } catch (error) {
      captureException(error);
      await dispatch(disableAlertFailed());
    }
  };
};

export const switchToAccount = (accountId: string): MetaMaskThunk => {
  return async (
    dispatch: MetaMaskReduxDispatch,
    getState: () => MetaMaskReduxState,
  ) => {
    const state = getState();

    try {
      await dispatch(switchAccountRequested());
      await dispatch(setSelectedInternalAccount(accountId));
      const internalAccount = getInternalAccount(state, accountId);
      await dispatch(setSelectedAccount(internalAccount.address));
      await dispatch(switchAccountSucceeded());
    } catch (error) {
      captureException(error);
      await dispatch(switchAccountFailed());
    }
  };
};

export const connectAccount = (): MetaMaskThunk => {
  return async (
    dispatch: MetaMaskReduxDispatch,
    getState: () => MetaMaskReduxState,
  ) => {
    const state = getState();
    const { address: selectedAddress } = getSelectedInternalAccount(state);
    const origin = getOriginOfCurrentTab(state);

    try {
      await dispatch(connectAccountRequested());
      await dispatch(addPermittedAccount(origin, selectedAddress));
      await dispatch(connectAccountSucceeded());
    } catch (error) {
      captureException(error);
      await dispatch(connectAccountFailed());
    }
  };
};
