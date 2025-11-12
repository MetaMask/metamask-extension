import {
  BridgeBackgroundAction,
  type BridgeController,
  BridgeUserAction,
  formatChainIdToCaip,
  isNativeAddress,
  type RequiredEventContextFromClient,
  UnifiedSwapBridgeEventName,
  isNonEvmChainId,
  formatChainIdToHex,
  getNativeAssetForChainId,
} from '@metamask/bridge-controller';
import { zeroAddress } from 'ethereumjs-util';
import { type Hex, type CaipChainId } from '@metamask/utils';
import { trace, TraceName } from '../../../shared/lib/trace';
import {
  forceUpdateMetamaskState,
  setActiveNetworkWithError,
} from '../../store/actions';
import { submitRequestToBackground } from '../../store/background-connection';
import type { MetaMaskReduxDispatch } from '../../store/store';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../../selectors/multichain-accounts/account-tree';
import {
  bridgeSlice,
  setDestTokenExchangeRates,
  setDestTokenUsdExchangeRates,
  setSrcTokenExchangeRates,
  setTxAlerts,
  setEVMSrcTokenBalance,
  setEVMSrcNativeBalance,
} from './bridge';
import type { TokenPayload } from './types';
import { type BridgeAppState, getFromChains } from './selectors';

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
  setDestTokenExchangeRates,
  setDestTokenUsdExchangeRates,
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

export const setEvmBalances = (
  chainId: string | number,
  tokenAddress?: string,
) => {
  return async (
    dispatch: MetaMaskReduxDispatch,
    getState: () => BridgeAppState,
  ) => {
    if (isNonEvmChainId(chainId)) {
      return;
    }
    const caipChainId = formatChainIdToCaip(chainId);
    const selectedAccount = getInternalAccountBySelectedAccountGroupAndCaip(
      getState(),
      caipChainId,
    );
    if (!selectedAccount) {
      return;
    }
    const hexChainId = formatChainIdToHex(chainId);
    await trace(
      {
        name: TraceName.BridgeBalancesUpdated,
        data: {
          chainId: caipChainId,
          isNative: isNativeAddress(tokenAddress),
        },
        startTime: Date.now(),
      },
      async () => {
        dispatch(
          setEVMSrcTokenBalance({
            selectedAddress: selectedAccount.address,
            tokenAddress: tokenAddress || zeroAddress(),
            chainId: hexChainId,
          }),
        );
        dispatch(
          setEVMSrcNativeBalance({
            selectedAddress: selectedAccount.address,
            chainId: hexChainId,
          }),
        );
      },
    );
  };
};

export const setFromChain = ({
  chainId,
  token = null,
}: {
  chainId?: Hex | CaipChainId;
  token?: TokenPayload['payload'];
}) => {
  return async (
    dispatch: MetaMaskReduxDispatch,
    getState: () => BridgeAppState,
  ) => {
    if (!chainId) {
      return;
    }

    // Check for ALL non-EVM chains
    const isNonEvm = isNonEvmChainId(chainId);

    // Set the src network
    if (isNonEvm) {
      dispatch(setActiveNetworkWithError(chainId));
    } else {
      const networkConfig = getFromChains(getState()).find(
        (chain) => chain.chainId === formatChainIdToHex(chainId),
      );
      if (networkConfig) {
        const networkId =
          networkConfig.rpcEndpoints?.[networkConfig.defaultRpcEndpointIndex]
            ?.networkClientId;
        dispatch(setActiveNetworkWithError(networkId));
      }
    }

    // Set the src token - if no token provided, use native token
    if (token) {
      dispatch(setFromToken(token));
    } else {
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
