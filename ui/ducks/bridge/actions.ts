import { BridgeBackgroundAction } from '../../../app/scripts/controllers/bridge/types';
import { forceUpdateMetamaskState } from '../../store/actions';
import { submitRequestToBackground } from '../../store/background-connection';
import { MetaMaskReduxDispatch } from '../../store/store';
import { swapsSlice } from '../swaps/swaps';
import { bridgeSlice } from './bridge';

// eslint-disable-next-line no-empty-pattern
const {} = swapsSlice.actions;

export const { setToChain } = bridgeSlice.actions;

const callBridgeControllerMethod = <T>(
  bridgeAction: BridgeBackgroundAction,
  args?: T[],
) => {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await submitRequestToBackground(bridgeAction, args);
    await forceUpdateMetamaskState(dispatch);
  };
};

// User actions

// Background actions
export const setBridgeFeatureFlags = () => {
  return async (dispatch: MetaMaskReduxDispatch) => {
    return dispatch(
      callBridgeControllerMethod(BridgeBackgroundAction.SET_FEATURE_FLAGS),
    );
  };
};
