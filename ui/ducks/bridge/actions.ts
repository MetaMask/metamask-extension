import {
  BridgeBackgroundAction,
  type BridgeController,
  BridgeUserAction,
  type RequiredEventContextFromClient,
  UnifiedSwapBridgeEventName,
  formatChainIdToHex,
  isCrossChain,
  isNonEvmChainId,
} from '@metamask/bridge-controller';
import { CaipAssetType, parseCaipAssetType } from '@metamask/utils';
import { selectDefaultNetworkClientIdsByChainId } from '../../../shared/modules/selectors/networks';
import {
  forceUpdateMetamaskState,
  setActiveNetworkWithError,
  setEnabledAllPopularNetworks,
} from '../../store/actions';
import { submitRequestToBackground } from '../../store/background-connection';
import type { MetaMaskReduxDispatch } from '../../store/store';
import { getMultichainProviderConfig } from '../../selectors/multichain';
import {
  bridgeSlice,
  setSrcTokenExchangeRates,
  setTxAlerts,
  setEVMSrcTokenBalance,
  setEVMSrcNativeBalance,
} from './bridge';
import type { TokenPayload } from './types';
import {
  type BridgeAppState,
  getFromAccount,
  getLastSelectedChainId,
} from './selectors';
import { getMaybeHexChainId } from './utils';

const {
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
  resetInputFields,
  setToToken,
  setFromTokenInputValue,
  setSrcTokenExchangeRates,
  setSortOrder,
  setSelectedQuote,
  setWasTxDeclined,
  setSlippage,
  setTxAlerts,
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

export const setEvmBalances = (assetId: CaipAssetType) => {
  return async (
    dispatch: MetaMaskReduxDispatch,
    getState: () => BridgeAppState,
  ) => {
    const selectedAddress = getFromAccount(getState())?.address;
    if (!selectedAddress) {
      return;
    }
    const { chainId, assetReference } = parseCaipAssetType(assetId);
    await dispatch(
      setEVMSrcTokenBalance({
        selectedAddress,
        tokenAddress: assetReference,
        chainId,
        assetId,
      }),
    );
    await dispatch(
      setEVMSrcNativeBalance({
        selectedAddress,
        chainId,
      }),
    );
  };
};

export const setFromToken = (token: TokenPayload) => {
  return async (
    dispatch: MetaMaskReduxDispatch,
    getState: () => BridgeAppState,
  ) => {
    const { assetId } = token;
    const { chainId } = parseCaipAssetType(assetId);
    const isNonEvm = isNonEvmChainId(chainId);

    const currentChainId = getMultichainProviderConfig(getState()).chainId;
    const shouldSetNetwork = ![chainId, getMaybeHexChainId(chainId)].some(
      (c) => c && c === currentChainId,
    );
    // Set the src network
    if (shouldSetNetwork) {
      // If the source chain changes, enable All Networks view so the user
      // can see their bridging activity on the new chain
      const lastSelectedChainId = getLastSelectedChainId(getState());
      if (isCrossChain(chainId, lastSelectedChainId)) {
        dispatch(setEnabledAllPopularNetworks());
      }
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
    }
    // Set the fromToken
    dispatch(setFromTokenAction(token));
  };
};
