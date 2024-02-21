import log from 'loglevel';
import { ThunkAction } from 'redux-thunk';
import { AnyAction } from 'redux';
import {
  forceUpdateMetamaskState,
  displayWarning,
  hideLoadingIndication,
  showLoadingIndication,
} from '../actions';
import {
  callBackgroundMethod,
  submitRequestToBackground,
} from '../background-connection';
import { MetaMaskReduxDispatch, MetaMaskReduxState } from '../store';
import { isErrorWithMessage } from '../../../shared/modules/error';

export function showInteractiveReplacementTokenBanner({
  url,
  oldRefreshToken,
}: {
  url: string;
  oldRefreshToken: string;
}) {
  return async (dispatch: MetaMaskReduxDispatch) => {
    try {
      await submitRequestToBackground('showInteractiveReplacementTokenBanner', [
        {
          url,
          oldRefreshToken,
        },
      ]);
    } catch (err: any) {
      if (err) {
        dispatch(displayWarning(err.message));
        throw new Error(err.message);
      }
    }
  };
}

export function setCustodianDeepLink({
  fromAddress,
  custodyId,
}: {
  fromAddress: string;
  custodyId: string;
}) {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await submitRequestToBackground('setCustodianDeepLink', [
      { fromAddress, custodyId },
    ]);
    await forceUpdateMetamaskState(dispatch);
  };
}

export function setTypedMessageInProgress(msgId: string) {
  return async (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());
    try {
      await submitRequestToBackground('setTypedMessageInProgress', [msgId]);
    } catch (error: any) {
      log.error(error);
      dispatch(displayWarning(error.message));
    } finally {
      await forceUpdateMetamaskState(dispatch);
      dispatch(hideLoadingIndication());
    }
  };
}

export function setPersonalMessageInProgress(msgId: string) {
  return async (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());
    try {
      await submitRequestToBackground('setPersonalMessageInProgress', [msgId]);
    } catch (error: any) {
      log.error(error);
      dispatch(displayWarning(error.message));
    } finally {
      await forceUpdateMetamaskState(dispatch);
      dispatch(hideLoadingIndication());
    }
  };
}

/**
 * A factory that contains all MMI actions ready to use
 * Example usage:
 * const mmiActions = mmiActionsFactory();
 * mmiActions.connectCustodyAddresses(...)
 */
export function mmiActionsFactory() {
  function createAsyncAction(
    name: string,
    params: any,
    useForceUpdateMetamaskState?: any,
    loadingText?: string,
  ): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
    log.debug(`background.${name}`);
    return async (dispatch: any) => {
      if (loadingText) {
        dispatch(showLoadingIndication(loadingText));
      }
      let result;
      try {
        result = await submitRequestToBackground(name, [...params]);
      } catch (error) {
        dispatch(displayWarning(error));
        if (isErrorWithMessage(error)) {
          throw new Error(error.message);
        } else {
          throw error;
        }
      }

      if (loadingText) {
        dispatch(hideLoadingIndication());
      }
      if (useForceUpdateMetamaskState) {
        await forceUpdateMetamaskState(dispatch);
      }
      return result;
    };
  }

  function createAction(name: string, payload: any) {
    return () => {
      callBackgroundMethod(name, [payload], (err) => {
        if (isErrorWithMessage(err)) {
          throw new Error(err.message);
        }
      });
    };
  }

  return {
    connectCustodyAddresses: (
      custodianType: string,
      custodianName: string,
      newAccounts: string[],
    ) =>
      createAsyncAction(
        'connectCustodyAddresses',
        [custodianType, custodianName, newAccounts],
        forceUpdateMetamaskState,
        'Looking for your custodian account...',
      ),
    getCustodianAccounts: (
      token: string,
      envName: string,
      custody: string,
      getNonImportedAccounts: boolean,
    ) =>
      createAsyncAction(
        'getCustodianAccounts',
        [token, envName, custody, getNonImportedAccounts],
        forceUpdateMetamaskState,
        'Getting custodian accounts...',
      ),
    // TODO (Bernardo) - It doesn't look like this is being used
    getCustodianAccountsByAddress: (
      jwt: string,
      envName: string,
      address: string,
      custody: string,
    ) =>
      createAsyncAction(
        'getCustodianAccountsByAddress',
        [jwt, envName, address, custody],
        forceUpdateMetamaskState,
        'Getting custodian accounts...',
      ),
    getCustodianTransactionDeepLink: (address: string, txId: string) =>
      createAsyncAction(
        'getCustodianTransactionDeepLink',
        [address, txId],
        forceUpdateMetamaskState,
      ),
    getCustodianConfirmDeepLink: (txId: string) =>
      createAsyncAction(
        'getCustodianConfirmDeepLink',
        [txId],
        forceUpdateMetamaskState,
      ),
    getCustodianSignMessageDeepLink: (from: string, custodyTxId: string) =>
      createAsyncAction(
        'getCustodianSignMessageDeepLink',
        [from, custodyTxId],
        forceUpdateMetamaskState,
      ),
    getCustodianToken: (custody: string) =>
      createAsyncAction(
        'getCustodianToken',
        [custody],
        forceUpdateMetamaskState,
      ),
    getCustodianJWTList: (custody: string) =>
      createAsyncAction(
        'getCustodianJWTList',
        [custody],
        forceUpdateMetamaskState,
      ),
    setWaitForConfirmDeepLinkDialog: (waitForConfirmDeepLinkDialog: boolean) =>
      createAction(
        'setWaitForConfirmDeepLinkDialog',
        waitForConfirmDeepLinkDialog,
      ),
    removeAddTokenConnectRequest: ({
      origin,
      environment,
      token,
    }: {
      origin: string;
      environment: string;
      token: string;
    }) =>
      createAction('removeAddTokenConnectRequest', {
        origin,
        environment,
        token,
      }),
    getMmiConfiguration: () => createAsyncAction('getMmiConfiguration', []),
    getAllCustodianAccountsWithToken: (custodyType: string, token: string) =>
      createAsyncAction('getAllCustodianAccountsWithToken', [
        custodyType,
        token,
      ]),
    setCustodianNewRefreshToken: ({
      address,
      refreshToken,
    }: {
      address: string;
      refreshToken: string;
    }) =>
      createAsyncAction('setCustodianNewRefreshToken', [
        { address, refreshToken },
      ]),
  };
}
