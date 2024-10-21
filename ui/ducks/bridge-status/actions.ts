import {
  BridgeStatusAction,
  StatusRequest,
} from '../../../app/scripts/controllers/bridge-status/types';
import { forceUpdateMetamaskState } from '../../store/actions';
import { submitRequestToBackground } from '../../store/background-connection';
import { MetaMaskReduxDispatch } from '../../store/store';

const callBridgeStatusControllerMethod = <T extends unknown[]>(
  bridgeAction: BridgeStatusAction,
  args?: T,
) => {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await submitRequestToBackground(bridgeAction, args);
    await forceUpdateMetamaskState(dispatch);
  };
};

export const startPollingForBridgeTxStatus = (statusRequest: StatusRequest) => {
  return async (dispatch: MetaMaskReduxDispatch) => {
    return dispatch(
      callBridgeStatusControllerMethod<[StatusRequest]>(
        BridgeStatusAction.START_POLLING_FOR_BRIDGE_TX_STATUS,
        [statusRequest],
      ),
    );
  };
};
