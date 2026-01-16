import { ThunkAction } from 'redux-thunk';
import { AnyAction } from 'redux';
import type {
  MetaMaskReduxDispatch,
  MetaMaskReduxState,
} from '../store';
import { displayWarning, hideLoadingIndication, hideWarning, showLoadingIndication } from '../actions';
import { setShowNewSrpAddedToast } from '../../components/app/toast-master/utils';
import log from 'loglevel';

export function createMpcWallet(): ThunkAction<
  Promise<void>,
  MetaMaskReduxState,
  undefined,
  AnyAction
> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());
    log.debug(`actions.createMpcWallet`);

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 1000);
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
