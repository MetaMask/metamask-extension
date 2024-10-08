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
import { ConnectionRequest } from '../../../shared/constants/mmi-controller';

export function showInteractiveReplacementTokenBanner({
  url,
  oldRefreshToken,
}: {
  url?: string;
  oldRefreshToken?: string;
}) {
  return async (dispatch: MetaMaskReduxDispatch) => {
    try {
      await submitRequestToBackground('showInteractiveReplacementTokenBanner', [
        {
          url,
          oldRefreshToken,
        },
      ]);
      // TODO: Replace `any` with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  return async (_dispatch: MetaMaskReduxDispatch) => {
    await submitRequestToBackground('setCustodianDeepLink', [
      { fromAddress, custodyId },
    ]);
  };
}

export function setNoteToTraderMessage(message: string) {
  return async (dispatch: MetaMaskReduxDispatch) => {
    try {
      await submitRequestToBackground('setNoteToTraderMessage', [message]);
      // TODO: Replace `any` with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error) {
        dispatch(displayWarning(error.message));
        throw new Error(error.message);
      }
    }
  };
}

export function setTypedMessageInProgress(msgId: string) {
  return async (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());
    try {
      await submitRequestToBackground('setTypedMessageInProgress', [msgId]);
      // TODO: Replace `any` with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      log.error(error);
      dispatch(displayWarning(error.message));
    } finally {
      dispatch(hideLoadingIndication());
    }
  };
}

export function setPersonalMessageInProgress(msgId: string) {
  return async (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());
    try {
      await submitRequestToBackground('setPersonalMessageInProgress', [msgId]);
      // TODO: Replace `any` with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      log.error(error);
      dispatch(displayWarning(error.message));
    } finally {
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
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    params: any,
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useForceUpdateMetamaskState?: any,
    loadingText?: string,
  ): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
    log.debug(`background.${name}`);
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    setConnectionRequest: (payload: ConnectionRequest | null) =>
      createAsyncAction('setConnectionRequest', [payload]),
  };
}
