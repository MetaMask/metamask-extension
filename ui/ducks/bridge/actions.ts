// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { BridgeBackgroundAction } from '../../../app/scripts/controllers/bridge/types';
import { forceUpdateMetamaskState } from '../../store/actions';
import { submitRequestToBackground } from '../../store/background-connection';
import { MetaMaskReduxDispatch } from '../../store/store';
import { bridgeSlice } from './bridge';

const { setToChain, setFromToken, setToToken, setFromTokenInputValue } =
  bridgeSlice.actions;

export { setToChain, setFromToken, setToToken, setFromTokenInputValue };

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
