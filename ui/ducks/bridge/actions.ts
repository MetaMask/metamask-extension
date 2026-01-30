import { zeroAddress } from 'ethereumjs-util';
import {
  BridgeBackgroundAction,
  type BridgeController,
  BridgeUserAction,
  type RequiredEventContextFromClient,
  UnifiedSwapBridgeEventName,
  formatChainIdToHex,
  isNativeAddress,
  isNonEvmChainId,
} from '@metamask/bridge-controller';
import { CaipAssetType, Hex, parseCaipAssetType } from '@metamask/utils';
import { trace, TraceName } from '../../../shared/lib/trace';
import {
  forceUpdateMetamaskState,
  setEnabledAllPopularNetworks,
} from '../../store/actions';
import { submitRequestToBackground } from '../../store/background-connection';
import type { MetaMaskReduxDispatch } from '../../store/store';
import { bridgeSlice, setSrcTokenExchangeRates, setTxAlerts } from './bridge';
import type { TokenPayload } from './types';
import {
  type BridgeAppState,
  getFromAccount,
  getLastSelectedChainId,
} from './selectors';

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
  setEVMSrcTokenBalance,
  setEVMSrcNativeBalance,
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
  bridgeAction: BridgeUserAction | BridgeBackgroundAction | 'getLatestBalance',
  ...args: unknown[]
) => {
  return async (dispatch: MetaMaskReduxDispatch) => {
    const result = await submitRequestToBackground(bridgeAction, args);
    await forceUpdateMetamaskState(dispatch);
    return result;
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

const getBalanceAmount = (
  isNative: boolean,
  srcChainId: Hex,
  ...args: unknown[]
) => {
  return async (dispatch: MetaMaskReduxDispatch) => {
    return await trace(
      {
        name: TraceName.BridgeBalancesUpdated,
        data: {
          srcChainId: srcChainId,
          isNative,
        },
        startTime: Date.now(),
      },
      async () =>
        await dispatch(
          callBridgeControllerMethod('getLatestBalance', ...args, srcChainId),
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
    if (isNonEvmChainId(chainId)) {
      return;
    }
    const hexChainId = formatChainIdToHex(chainId);
    const isNative = isNativeAddress(assetReference);

    const balance = await dispatch(
      getBalanceAmount(isNative, hexChainId, selectedAddress, assetReference),
    );
    dispatch(
      setEVMSrcTokenBalance({
        assetId,
        balance,
      }),
    );

    const nativeBalance = await dispatch(
      getBalanceAmount(true, hexChainId, selectedAddress, zeroAddress()),
    );
    dispatch(
      setEVMSrcNativeBalance({
        chainId,
        balance: nativeBalance,
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

    const lastSelectedChainId = getLastSelectedChainId(getState());
    const currentNetworkMatchesToken = chainId === lastSelectedChainId;

    // If the source token's chain changes, enable All Networks view so the user
    // can see their bridging activity on the new chain
    if (!currentNetworkMatchesToken) {
      dispatch(setEnabledAllPopularNetworks());
    }
    // Set the fromToken
    dispatch(setFromTokenAction(token));
  };
};
