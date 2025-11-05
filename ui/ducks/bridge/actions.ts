import {
  BridgeBackgroundAction,
  type BridgeController,
  BridgeUserAction,
  formatChainIdToHex,
  isNativeAddress,
  type RequiredEventContextFromClient,
  UnifiedSwapBridgeEventName,
} from '@metamask/bridge-controller';
import { type CaipChainId } from '@metamask/utils';
import { zeroAddress } from 'ethereumjs-util';
import { trace, TraceName } from '../../../shared/lib/trace';
import { forceUpdateMetamaskState } from '../../store/actions';
import { submitRequestToBackground } from '../../store/background-connection';
import type { MetaMaskReduxDispatch } from '../../store/store';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../../selectors/multichain-accounts/account-tree';
import {
  bridgeSlice,
  setDestTokenExchangeRates,
  setDestTokenUsdExchangeRates,
  setSrcTokenExchangeRates,
  setTxAlerts,
} from './bridge';
import type { TokenPayload } from './types';
import { isNonEvmChain } from './utils';
import { type BridgeAppState } from './selectors';

const {
  setFromChainId,
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
  setEVMSrcNativeBalance,
  setEVMSrcTokenBalance,
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
  bridgeAction: BridgeUserAction | BridgeBackgroundAction | 'getBalanceAmount',
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

export const setBalanceAmount = ({
  chainId,
  shouldSetGasTokenBalance = false,
  token,
}: {
  chainId: CaipChainId;
  shouldSetGasTokenBalance?: boolean;
  token?: TokenPayload['payload'];
}) => {
  return async (
    dispatch: MetaMaskReduxDispatch,
    getState: () => BridgeAppState,
  ) => {
    if (isNonEvmChain(chainId)) {
      return;
    }
    const chainIdToUse = chainId ?? token?.chainId;
    const accountAddress = getInternalAccountBySelectedAccountGroupAndCaip(
      getState(),
      chainIdToUse,
    )?.address;

    // const isNative = isNativeAddress(token?.address);
    trace({
      name: TraceName.BridgeBalancesUpdated,
      data: {
        srcChainId: chainId,
        isNative: isNativeAddress(token?.address),
      },
      startTime: Date.now(),
    });

    const balance = (await dispatch(
      await callBridgeControllerMethod(
        'getBalanceAmount',
        accountAddress,
        token?.address || zeroAddress(),
        formatChainIdToHex(chainIdToUse),
      ),
    )) as string;
    if (shouldSetGasTokenBalance) {
      dispatch(
        setEVMSrcNativeBalance({
          balance,
          chainId: chainIdToUse,
        }),
      );
    } else {
      dispatch(
        setEVMSrcTokenBalance({
          balance,
          assetId: token?.assetId,
        }),
      );
    }
  };
};
export const setFromChain = ({
  chainId,
  token = null,
}: {
  chainId?: CaipChainId | null;
  token?: TokenPayload['payload'];
}) => {
  return async (dispatch: MetaMaskReduxDispatch) => {
    if (!chainId) {
      dispatch(setFromChainId(null));
      return;
    }
    // const selectedAccount = getInternalAccountBySelectedAccountGroupAndCaip(
    //   getState(),
    //   chainId,
    // );
    // const networkConfig = isNonEvm
    //   ? undefined
    //   : (getNetworkConfigurationsByChainId(getState())[
    //       formatChainIdToHex(chainId)
    //     ] as NetworkConfiguration);

    // Set the src network
    dispatch(setFromChainId(chainId));

    // Set the src token if provided
    if (token) {
      dispatch(setFromToken(token));
      dispatch(
        setBalanceAmount({
          token,
          chainId,
        }),
      );
    }

    // Fetch the native balance (EVM only)
    if (chainId) {
      await dispatch(
        setBalanceAmount({
          shouldSetGasTokenBalance: true,
          chainId,
        }),
      );
    }
  };
};
