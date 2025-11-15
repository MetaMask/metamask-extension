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
} from '@metamask/bridge-controller';
import { zeroAddress } from 'ethereumjs-util';
import { type CaipChainId } from '@metamask/utils';
import { trace, TraceName } from '../../../shared/lib/trace';
import {
  forceUpdateMetamaskState,
  setActiveNetworkWithError,
} from '../../store/actions';
import { submitRequestToBackground } from '../../store/background-connection';
import type { MetaMaskReduxDispatch } from '../../store/store';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../../selectors/multichain-accounts/account-tree';
import {
  getSelectedMultichainNetworkChainId,
  selectNetworkConfigurationByChainId,
} from '../../selectors';
import {
  bridgeSlice,
  setDestTokenExchangeRates,
  setDestTokenUsdExchangeRates,
  setSrcTokenExchangeRates,
  setTxAlerts,
  setEVMSrcTokenBalance,
  setEVMSrcNativeBalance,
} from './bridge';
import type { BridgeToken, TokenPayload } from './types';
import { type BridgeAppState } from './selectors';

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

export const setEvmBalances = ({
  chainId,
  address: tokenAddress,
  assetId,
}: BridgeToken) => {
  return async (
    dispatch: MetaMaskReduxDispatch,
    getState: () => BridgeAppState,
  ) => {
    if (isNonEvmChainId(chainId)) {
      return;
    }
    const selectedAccount = getInternalAccountBySelectedAccountGroupAndCaip(
      getState(),
      chainId,
    );
    if (!selectedAccount) {
      return;
    }
    await trace(
      {
        name: TraceName.BridgeBalancesUpdated,
        data: {
          chainId,
          isNative: isNativeAddress(tokenAddress),
        },
        startTime: Date.now(),
      },
      async () => {
        dispatch(
          setEVMSrcTokenBalance({
            selectedAddress: selectedAccount.address,
            tokenAddress: tokenAddress || zeroAddress(),
            chainId,
            assetId,
          }),
        );
        dispatch(
          setEVMSrcNativeBalance({
            selectedAddress: selectedAccount.address,
            chainId,
          }),
        );
      },
    );
  };
};

export const setFromToken = ({
  chainId,
  token = null,
}: {
  /**
   * @deprecated Remove this after GNS references are removed
   */
  chainId: CaipChainId;
  token?: TokenPayload['payload'];
}) => {
  return async (
    dispatch: MetaMaskReduxDispatch,
    getState: () => BridgeAppState,
  ) => {
    const currentNetworkChainId =
      getSelectedMultichainNetworkChainId(getState());
    if (currentNetworkChainId !== chainId) {
      // Check for ALL non-EVM chains
      const isNonEvm = isNonEvmChainId(chainId);
      // Set the src network
      if (isNonEvm) {
        const caipChainId = formatChainIdToCaip(chainId);
        dispatch(setActiveNetworkWithError(caipChainId));
      } else {
        const networkConfig = selectNetworkConfigurationByChainId(
          getState(),
          formatChainIdToHex(chainId),
        );
        const networkId = networkConfig
          ? networkConfig.rpcEndpoints?.[networkConfig.defaultRpcEndpointIndex]
              ?.networkClientId
          : undefined;
        if (networkId) {
          dispatch(setActiveNetworkWithError(networkId));
        }
      }
    }
    if (token) {
      dispatch(setFromTokenAction(token));
    }
  };
};
