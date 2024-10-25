// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { Hex } from '@metamask/utils';
import {
  BridgeBackgroundAction,
  BridgeUserAction,
  // TODO: Remove restricted import
  // eslint-disable-next-line import/no-restricted-paths
} from '../../../app/scripts/controllers/bridge/types';

import { forceUpdateMetamaskState } from '../../store/actions';
import { submitRequestToBackground } from '../../store/background-connection';
import { MetaMaskReduxDispatch } from '../../store/store';
import { QuoteRequest } from '../../pages/bridge/types';
import { bridgeSlice } from './bridge';

const {
  setToChainId,
  setFromToken,
  setToToken,
  setFromTokenInputValue,
  resetInputFields,
} = bridgeSlice.actions;

export {
  setToChainId,
  resetInputFields,
  setToToken,
  setFromToken,
  setFromTokenInputValue,
};

const callBridgeControllerMethod = <T>(
  bridgeAction: BridgeUserAction | BridgeBackgroundAction,
  args?: T,
) => {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await submitRequestToBackground(bridgeAction, [args]);
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
export const setFromChain = (chainId: Hex) => {
  return async (dispatch: MetaMaskReduxDispatch) => {
    dispatch(
      callBridgeControllerMethod<Hex>(
        BridgeUserAction.SELECT_SRC_NETWORK,
        chainId,
      ),
    );
  };
};

export const setToChain = (chainId: Hex) => {
  return async (dispatch: MetaMaskReduxDispatch) => {
    dispatch(
      callBridgeControllerMethod<Hex>(
        BridgeUserAction.SELECT_DEST_NETWORK,
        chainId,
      ),
    );
  };
};

export const updateQuoteRequestParams = (params: Partial<QuoteRequest>) => {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await dispatch(
      callBridgeControllerMethod(BridgeUserAction.UPDATE_QUOTE_PARAMS, params),
    );
  };
};
