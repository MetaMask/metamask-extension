import BridgeStatusController from '../../../app/scripts/controllers/bridge-status/bridge-status-controller';
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

export const getBridgeTxStatus = (statusRequest: StatusRequest) => {
  return async (dispatch: MetaMaskReduxDispatch) => {
    return dispatch(
      callBridgeStatusControllerMethod<
        Parameters<
          BridgeStatusController[BridgeStatusAction.START_POLLING_FOR_BRIDGE_TX_STATUS]
        >
      >(BridgeStatusAction.START_POLLING_FOR_BRIDGE_TX_STATUS, [statusRequest]),
    );
  };
};
