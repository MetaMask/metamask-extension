import { ThunkAction } from 'redux-thunk';
import { AnyAction } from 'redux';
import log from 'loglevel';
import type { MetaMaskReduxDispatch, MetaMaskReduxState } from '../store';
import {
  displayWarning,
  hideLoadingIndication,
  hideWarning,
  showLoadingIndication,
} from '../actions';
import { setShowNewSrpAddedToast } from '../../components/app/toast-master/utils';
import { submitRequestToBackground } from '../background-connection';

export type Custodian = {
  partyId: string;
  type: 'cloud' | 'user';
};

export function createMpcKeyring(
  verifierId: string,
): ThunkAction<Promise<string>, MetaMaskReduxState, undefined, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());
    log.debug(`actions.createMpcKeyring`);

    const keyringId = await submitRequestToBackground<string>(
      'createMpcKeyring',
      [verifierId],
    )
      .then(async (result) => {
        dispatch(hideLoadingIndication());
        dispatch(hideWarning());
        dispatch(setShowNewSrpAddedToast(true));
        return result;
      })
      .catch((err) => {
        dispatch(displayWarning(err));
        dispatch(hideLoadingIndication());
        return Promise.reject(err);
      });
    return keyringId;
  };
}

export type SetupMpcIdentityResult = {
  keyringId: string;
  partyId: string;
};

export function setupMpcIdentity(): ThunkAction<
  Promise<SetupMpcIdentityResult>,
  MetaMaskReduxState,
  undefined,
  AnyAction
> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());
    log.debug(`actions.setupMpcIdentity`);

    const result = await submitRequestToBackground<SetupMpcIdentityResult>(
      'setupMpcIdentity',
      [],
    )
      .then((res) => {
        dispatch(hideLoadingIndication());
        dispatch(hideWarning());
        return res;
      })
      .catch((err) => {
        dispatch(displayWarning(err));
        dispatch(hideLoadingIndication());
        return Promise.reject(err);
      });
    return result;
  };
}

export function joinMpcWallet(
  keyringId: string,
  verifierId: string,
  initiator: string,
): ThunkAction<Promise<void>, MetaMaskReduxState, undefined, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());
    log.debug(`actions.joinMpcWallet`);

    await submitRequestToBackground<void>('joinMpcWallet', [
      keyringId,
      verifierId,
      initiator,
    ])
      .then(() => {
        dispatch(hideLoadingIndication());
        dispatch(hideWarning());
        dispatch(setShowNewSrpAddedToast(true));
      })
      .catch((err) => {
        dispatch(displayWarning(err));
        dispatch(hideLoadingIndication());
        return Promise.reject(err);
      });
  };
}

export function getMpcCustodians(
  keyringId: string,
): ThunkAction<Promise<Custodian[]>, MetaMaskReduxState, undefined, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    log.debug(`actions.getMpcCustodians`);

    const custodians = await submitRequestToBackground<Custodian[]>(
      'getMpcCustodians',
      [keyringId],
    ).catch((err) => {
      dispatch(displayWarning(err));
      return Promise.reject(err);
    });
    return custodians;
  };
}

export function getMpcCustodianId(
  keyringId: string,
): ThunkAction<Promise<string>, MetaMaskReduxState, undefined, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    log.debug(`actions.getMpcCustodianId`);

    const custodianId = await submitRequestToBackground<string>(
      'getMpcCustodianId',
      [keyringId],
    ).catch((err) => {
      dispatch(displayWarning(err));
      return Promise.reject(err);
    });
    return custodianId;
  };
}

export function addMpcCustodian(
  keyringId: string,
  custodianId: string,
): ThunkAction<Promise<void>, MetaMaskReduxState, undefined, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());
    log.debug(`actions.addMpcCustodian`);

    await submitRequestToBackground<void>('addMpcCustodian', [
      keyringId,
      custodianId,
    ])
      .then(() => {
        dispatch(hideLoadingIndication());
        dispatch(hideWarning());
      })
      .catch((err) => {
        dispatch(displayWarning(err));
        dispatch(hideLoadingIndication());
        return Promise.reject(err);
      });
  };
}
