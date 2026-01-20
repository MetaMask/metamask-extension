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
import { callBackgroundMethod } from '../background-connection';

export function createMpcWallet(): ThunkAction<
  Promise<void>,
  MetaMaskReduxState,
  undefined,
  AnyAction
> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());
    log.debug(`actions.createMpcWallet`);

    return new Promise<void>((resolve, reject) => {
      callBackgroundMethod<void>('createMpcWallet', [], (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      });
    })
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
  };
}
