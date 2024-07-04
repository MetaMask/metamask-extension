import { ProviderConfig } from '@metamask/network-controller';
import { Hex } from '@metamask/utils';
import { forceUpdateMetamaskState } from '../../store/actions';
import { submitRequestToBackground } from '../../store/background-connection';
import { swapsSlice } from '../swaps/swaps';
import { RPCDefinition } from '../../../shared/constants/network';
import { MetaMaskReduxDispatch } from '../../store/store';
import {
  BridgeBackgroundAction,
  BridgeUserAction,
} from '../../../app/scripts/controllers/bridge';
import { bridgeSlice } from './bridge';

// Proxied swaps actions
export const { setFromToken, setToToken, setFromTokenInputValue } =
  swapsSlice.actions;

const { setToChain: setToChain_ } = bridgeSlice.actions;

const callBridgeControllerMethod = <T>(
  bridgeAction: BridgeUserAction | BridgeBackgroundAction,
  args?: T[],
) => {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await submitRequestToBackground(bridgeAction, args);
    await forceUpdateMetamaskState(dispatch);
  };
};

// Background actions
export const setBridgeFeatureFlags = () => {
  return async (dispatch: MetaMaskReduxDispatch) => {
    return dispatch(
      callBridgeControllerMethod(BridgeBackgroundAction.SET_FEATURE_FLAGS),
    );
  };
};

// User actions
export const setToChain = (network: ProviderConfig | RPCDefinition) => {
  return async (dispatch: MetaMaskReduxDispatch) => {
    const { chainId } = network;
    // TODO if network has not been added (network.id === undefined), add new network OR prompt user to add network
    try {
      dispatch(setToChain_(network));
      dispatch(
        callBridgeControllerMethod<Hex>(BridgeUserAction.SELECT_DEST_NETWORK, [
          chainId,
        ]),
      );
    } catch (error) {
      // TODO reset to previous chain, empty token and top assets lists
    }
  };
};
