import {
  BridgeBackgroundAction,
  type BridgeController,
  BridgeUserAction,
  formatChainIdToCaip,
  formatChainIdToHex,
  isNativeAddress,
  isSolanaChainId,
  type RequiredEventContextFromClient,
  UnifiedSwapBridgeEventName,
} from '@metamask/bridge-controller';
import { type InternalAccount } from '@metamask/keyring-internal-api';
import { type CaipChainId } from '@metamask/utils';
import type {
  AddNetworkFields,
  NetworkConfiguration,
} from '@metamask/network-controller';
import { trace, TraceName } from '../../../shared/lib/trace';
import {
  forceUpdateMetamaskState,
  setActiveNetworkWithError,
  setSelectedAccount,
} from '../../store/actions';
import { submitRequestToBackground } from '../../store/background-connection';
import type { MetaMaskReduxDispatch } from '../../store/store';
import {
  bridgeSlice,
  setDestTokenExchangeRates,
  setDestTokenUsdExchangeRates,
  setSrcTokenExchangeRates,
  setTxAlerts,
  setEVMSrcTokenBalance,
} from './bridge';
import { isNetworkAdded } from './utils';
import type { TokenPayload } from './types';

const {
  setToChainId,
  setFromToken: setFromToken_,
  setToToken,
  setFromTokenInputValue,
  resetInputFields,
  setSortOrder,
  setSelectedQuote,
  setWasTxDeclined,
  setSlippage,
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

const setFromToken = (
  token: TokenPayload['payload'],
  selectedAddress: string,
) => {
  return async (dispatch: MetaMaskReduxDispatch) => {
    dispatch(setFromToken_(token));

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
        setEVMSrcTokenBalance({
          selectedAddress,
          tokenAddress: token.address,
          chainId: formatChainIdToHex(token.chainId),
        }),
      );
    }
  };
};

export const setFromChain = ({
  networkConfig,
  selectedSolanaAccount,
  selectedEvmAccount,
  token = null,
}: {
  networkConfig?:
    | NetworkConfiguration
    | AddNetworkFields
    | (Omit<NetworkConfiguration, 'chainId'> & { chainId: CaipChainId });
  selectedSolanaAccount?: InternalAccount;
  selectedEvmAccount?: InternalAccount;
  token?: TokenPayload['payload'];
}) => {
  return async (dispatch: MetaMaskReduxDispatch) => {
    if (
      networkConfig &&
      isSolanaChainId(networkConfig.chainId) &&
      selectedSolanaAccount
    ) {
      await dispatch(setSelectedAccount(selectedSolanaAccount.address));
    } else if (isNetworkAdded(networkConfig) && selectedEvmAccount) {
      await dispatch(setSelectedAccount(selectedEvmAccount.address));
      await dispatch(
        setActiveNetworkWithError(
          networkConfig.rpcEndpoints[networkConfig.defaultRpcEndpointIndex]
            .networkClientId || networkConfig.chainId,
        ),
      );
    }
    if (token) {
      await dispatch(
        setFromToken(
          token,
          selectedEvmAccount?.address ?? selectedSolanaAccount?.address ?? '',
        ),
      );
    }
  };
};
