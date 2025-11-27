import {
  BridgeBackgroundAction,
  type BridgeController,
  BridgeUserAction,
  formatChainIdToCaip,
  isNativeAddress,
  type RequiredEventContextFromClient,
  UnifiedSwapBridgeEventName,
  formatChainIdToHex,
  isCrossChain,
  isNonEvmChainId,
} from '@metamask/bridge-controller';
import { trace, TraceName } from '../../../shared/lib/trace';
import { selectDefaultNetworkClientIdsByChainId } from '../../../shared/modules/selectors/networks';
import {
  forceUpdateMetamaskState,
  setActiveNetworkWithError,
} from '../../store/actions';
import { submitRequestToBackground } from '../../store/background-connection';
import type { MetaMaskReduxDispatch } from '../../store/store';
import {
  bridgeSlice,
  setSrcTokenExchangeRates,
  setTxAlerts,
  setEVMSrcTokenBalance as setEVMSrcTokenBalance_,
  setEVMSrcNativeBalance,
} from './bridge';
import { type TokenPayload } from './types';
import { type BridgeAppState, getFromChain } from './selectors';

const {
  setToChainId,
  setFromToken: setFromTokenAction,
  setToToken,
  setFromTokenInputValue,
  resetInputFields,
  setSortOrder,
  setSelectedQuote,
  setWasTxDeclined,
  setSlippage,
  restoreQuoteRequestFromState,
} = bridgeSlice.actions;

export {
  setToChainId,
  resetInputFields,
  setToToken,
  setFromTokenInputValue,
  setSrcTokenExchangeRates,
  setSortOrder,
  setSelectedQuote,
  setWasTxDeclined,
  setSlippage,
  setTxAlerts,
  setEVMSrcNativeBalance,
  restoreQuoteRequestFromState,
};

const callBridgeControllerMethod = (
  bridgeAction: BridgeUserAction | BridgeBackgroundAction,
  ...args: unknown[]
) => {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await submitRequestToBackground(bridgeAction, args);
    await forceUpdateMetamaskState(dispatch);
  };
};

// Background actions
export const resetBridgeState = () => {
  return async (dispatch: MetaMaskReduxDispatch) => {
    dispatch(resetInputFields());
    dispatch(callBridgeControllerMethod(BridgeBackgroundAction.RESET_STATE));
  };
};

export const trackUnifiedSwapBridgeEvent = <
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  T extends
    (typeof UnifiedSwapBridgeEventName)[keyof typeof UnifiedSwapBridgeEventName],
>(
  eventName: T,
  propertiesFromClient: Pick<RequiredEventContextFromClient, T>[T],
) => {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await dispatch(
      callBridgeControllerMethod(
        BridgeBackgroundAction.TRACK_METAMETRICS_EVENT,
        eventName,
        propertiesFromClient,
      ),
    );
  };
};

// User actions
export const updateQuoteRequestParams = (
  ...[params, context]: Parameters<
    BridgeController['updateBridgeQuoteRequestParams']
  >
) => {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await dispatch(
      callBridgeControllerMethod(
        BridgeUserAction.UPDATE_QUOTE_PARAMS,
        params,
        context,
      ),
    );
  };
};

export const setEVMSrcTokenBalance = (
  token: TokenPayload['payload'],
  selectedAddress?: string,
) => {
  return async (dispatch: MetaMaskReduxDispatch) => {
    if (token) {
      trace({
        name: TraceName.BridgeBalancesUpdated,
        data: {
          srcChainId: formatChainIdToCaip(token.chainId),
          isNative: isNativeAddress(token.address),
        },
        startTime: Date.now(),
      });
      await dispatch(
        setEVMSrcTokenBalance_({
          selectedAddress,
          tokenAddress: token.address,
          chainId: token.chainId,
        }),
      );
    }
  };
};

export const setFromToken = (token: NonNullable<TokenPayload['payload']>) => {
  return async (
    dispatch: MetaMaskReduxDispatch,
    getState: () => BridgeAppState,
  ) => {
    const { chainId } = token;
    const isNonEvm = isNonEvmChainId(chainId);

    const currentChainId = getFromChain(getState())?.chainId;
    const shouldSetNetwork = currentChainId
      ? isCrossChain(currentChainId, chainId)
      : true;
    // Set the src network
    if (shouldSetNetwork) {
      if (isNonEvm) {
        const caipChainId = formatChainIdToCaip(chainId);
        dispatch(setActiveNetworkWithError(caipChainId));
      } else {
        const hexChainId = formatChainIdToHex(chainId);
        const networkId =
          selectDefaultNetworkClientIdsByChainId(getState())[hexChainId];
        if (networkId && shouldSetNetwork) {
          dispatch(setActiveNetworkWithError(networkId));
        }
      }
    }
    // Set the fromToken
    dispatch(setFromTokenAction(token));
  };
};
