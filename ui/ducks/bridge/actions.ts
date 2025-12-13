import {
  BridgeBackgroundAction,
  type BridgeController,
  BridgeUserAction,
  formatChainIdToCaip,
  isNativeAddress,
  getNativeAssetForChainId,
  type RequiredEventContextFromClient,
  UnifiedSwapBridgeEventName,
  formatChainIdToHex,
} from '@metamask/bridge-controller';
import type { CaipChainId, Hex } from '@metamask/utils';
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
import { type BridgeAppState } from './selectors';
import { isNonEvmChain } from './utils';

const {
  setToChainId,
  setFromToken,
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
  setFromToken,
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

export const setFromChain = ({
  chainId,
  token = null,
}: {
  chainId: Hex | CaipChainId;
  token?: TokenPayload['payload'] | null;
}) => {
  return async (
    dispatch: MetaMaskReduxDispatch,
    getState: () => BridgeAppState,
  ) => {
    // Check for ALL non-EVM chains
    const isNonEvm = isNonEvmChain(chainId);

    // Set the src network
    if (isNonEvm) {
      dispatch(setActiveNetworkWithError(chainId));
    } else {
      const hexChainId = formatChainIdToHex(chainId);
      const networkId =
        selectDefaultNetworkClientIdsByChainId(getState())[hexChainId];
      if (networkId) {
        dispatch(setActiveNetworkWithError(networkId));
      }
    }

    // Set the src token - if no token provided, set native token for non-EVM chains
    if (token) {
      dispatch(setFromToken(token));
    } else if (isNonEvm) {
      // Auto-select native token for non-EVM chains when switching
      const nativeAsset = getNativeAssetForChainId(chainId);
      if (nativeAsset) {
        dispatch(
          setFromToken({
            ...nativeAsset,
            chainId,
          }),
        );
      }
    }
  };
};
