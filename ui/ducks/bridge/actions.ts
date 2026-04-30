import {
  BridgeBackgroundAction,
  type BridgeController,
  BridgeUserAction,
  type RequiredEventContextFromClient,
  UnifiedSwapBridgeEventName,
  isCrossChain,
  isNonEvmChainId,
} from '@metamask/bridge-controller';
import { CaipAssetType, parseCaipAssetType } from '@metamask/utils';
import { selectDefaultNetworkClientIdsByChainId } from '../../../shared/lib/selectors/networks';
import {
  addNetwork,
  forceUpdateMetamaskState,
  setActiveNetworkWithError,
  setEnabledAllPopularNetworks,
} from '../../store/actions';
import { submitRequestToBackground } from '../../store/background-connection';
import type { MetaMaskReduxDispatch } from '../../store/store';
import {
  getMultichainNetworkConfigurationsByChainId,
  getMultichainProviderConfig,
} from '../../selectors/multichain';
import { FEATURED_RPCS } from '../../../shared/constants/network';
import { captureException } from '../../../shared/lib/sentry';
import { clearAllBridgeCacheItems } from '../../pages/bridge/utils/cache';
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
  getFromAmount,
  getFromChains,
  getFromToken,
  getLastSelectedChainId,
  getToToken,
} from './selectors';
import {
  getDefaultToToken,
  getMaybeHexChainId,
  isSupportedBridgeChain,
} from './utils';
import { BridgeMissingNetworkConfigError } from './errors';

const {
  setFromToken: setFromTokenAction,
  setToToken: setToTokenAction,
  setFromTokenInputValue,
  resetInputFields,
  rehydrateBridgeStore,
  setSortOrder,
  setSelectedQuote,
  setWasTxDeclined,
  setSlippage,
  restoreQuoteRequestFromState,
  setIsSrcAssetPickerOpen,
  setIsDestAssetPickerOpen,
} = bridgeSlice.actions;

export {
  resetInputFields,
  rehydrateBridgeStore,
  setFromTokenInputValue,
  setSrcTokenExchangeRates,
  setSortOrder,
  setSelectedQuote,
  setWasTxDeclined,
  setSlippage,
  setTxAlerts,
  restoreQuoteRequestFromState,
  setIsSrcAssetPickerOpen,
  setIsDestAssetPickerOpen,
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
export const resetBridgeController = () => {
  return async (dispatch: MetaMaskReduxDispatch) => {
    dispatch(callBridgeControllerMethod(BridgeBackgroundAction.RESET_STATE));
    await clearAllBridgeCacheItems();
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
    const maybeHexChainId = getMaybeHexChainId(chainId);

    // Deep links and other external callers can inject tokens from arbitrary chains;
    // this check prevents invalid state from propagating to selectors and components that
    // assume fromToken is always on a supported, enabled chain.
    if (!isSupportedBridgeChain(chainId)) {
      return;
    }

    if (maybeHexChainId) {
      const networkConfigs =
        getMultichainNetworkConfigurationsByChainId(getState());
      if (!networkConfigs[maybeHexChainId]) {
        const featuredRpc = FEATURED_RPCS.find(
          (rpc) => rpc.chainId === maybeHexChainId,
        );
        if (featuredRpc) {
          // EVM chain is supported but not yet in the user's network configs.
          // Auto-enable it via addNetwork, then fall through so the rest of
          // setFromToken runs immediately with the updated state; no external
          // retry needed and no risk of spurious re-dispatches.
          await dispatch(addNetwork(featuredRpc));
        } else {
          // Supported bridge chain absent from both user configs and FEATURED_RPCS —
          // this is a configuration bug that must be fixed in FEATURED_RPCS.
          captureException(
            new BridgeMissingNetworkConfigError(chainId, maybeHexChainId),
          );
          return;
        }
      }
    }

    const currentChainId = getMultichainProviderConfig(getState()).chainId;
    const currentNetworkMatchesToken = [chainId, maybeHexChainId].some(
      (c) => c && c === currentChainId,
    );

    // Set the src network
    if (!currentNetworkMatchesToken) {
      // If the source chain changes, enable All Networks view so the user
      // can see their bridging activity on the new chain
      const lastSelectedChainId = getLastSelectedChainId(getState());
      if (isCrossChain(chainId, lastSelectedChainId)) {
        dispatch(setEnabledAllPopularNetworks());
      }
      if (isNonEvm) {
        dispatch(setActiveNetworkWithError(chainId));
      } else if (maybeHexChainId) {
        const networkId =
          selectDefaultNetworkClientIdsByChainId(getState())[maybeHexChainId];
        if (networkId) {
          dispatch(setActiveNetworkWithError(networkId));
        }
      }
    }
    // Set the fromToken
    dispatch(setFromTokenAction(token));
  };
};

export const setToToken = (newToToken: TokenPayload) => {
  return async (
    dispatch: MetaMaskReduxDispatch,
    getState: () => BridgeAppState,
  ) => {
    const state = getState();
    const currentFromAmount = getFromAmount(state);
    const fromToken = getFromToken(state);
    const toToken = getToToken(state);
    const fromChains = getFromChains(state);
    // If the new toToken is the same as the current fromToken
    // try to set the fromToken to the old toToken
    if (fromToken?.assetId.toLowerCase() === newToToken.assetId.toLowerCase()) {
      let fromTokenToUse = toToken;

      // If the old toToken's chain is disabled, it can't be set as the fromToken
      // So reset fromToken to a fallback value (either native or default)
      if (
        fromChains.every(({ chainId }) => chainId !== fromTokenToUse.chainId)
      ) {
        // If the new toToken is native, use default as the new fromToken
        // otherwise use the native asset
        fromTokenToUse = getDefaultToToken(
          fromToken.chainId,
          fromToken.assetId,
        );
      }
      // @ts-expect-error - GasFeeState's nested union type is causing a type mismatch
      dispatch(setFromToken(fromTokenToUse));
    }

    dispatch(setToTokenAction(newToToken));
    dispatch(setFromTokenInputValue(currentFromAmount));
  };
};
