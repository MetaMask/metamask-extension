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

export type MpcCustodian = {
  id: string;
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

export function getMpcCustodians(
  keyringId: string,
): ThunkAction<
  Promise<MpcCustodian[]>,
  MetaMaskReduxState,
  undefined,
  AnyAction
> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    log.debug(`actions.getMpcCustodians`);

    const custodians = await submitRequestToBackground<MpcCustodian[]>(
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
  peerId: string,
): ThunkAction<Promise<void>, MetaMaskReduxState, undefined, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());
    log.debug(`actions.addMpcCustodian`);

    await submitRequestToBackground<void>('addMpcCustodian', [
      keyringId,
      peerId,
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
