import { ProviderConfig } from '@metamask/network-controller';
import { Hex } from '@metamask/utils';
import {
  forceUpdateMetamaskState,
  setActiveNetwork,
} from '../../store/actions';
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

const isProviderConfig = (n: unknown): n is ProviderConfig =>
  typeof n === 'object' && n !== null && 'id' in n;

// Background actions
export const setBridgeFeatureFlags = () => {
  return (dispatch: MetaMaskReduxDispatch) => {
    return dispatch(
      callBridgeControllerMethod(BridgeBackgroundAction.SET_FEATURE_FLAGS),
    );
  };
};

// User actions
export const setFromChain = (network: ProviderConfig | RPCDefinition) => {
  return async (dispatch: MetaMaskReduxDispatch) => {
    const { chainId } = network;
    if (!isProviderConfig(network)) {
      // TODO add new network and set it as active using upsertNetworkConfiguration
    } else if (isProviderConfig(network) && network.id) {
      dispatch(setActiveNetwork(network.id));
    }
    dispatch(
      callBridgeControllerMethod<Hex>(BridgeUserAction.SELECT_SRC_NETWORK, [
        chainId,
      ]),
    );
  };
};

export const setToChain = (network: ProviderConfig | RPCDefinition) => {
  return async (dispatch: MetaMaskReduxDispatch) => {
    const { chainId } = network;
    dispatch(setToChain_(network));
    dispatch(
      callBridgeControllerMethod<Hex>(BridgeUserAction.SELECT_DEST_NETWORK, [
        chainId,
      ]),
    );
  };
};
