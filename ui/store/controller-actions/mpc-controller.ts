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
