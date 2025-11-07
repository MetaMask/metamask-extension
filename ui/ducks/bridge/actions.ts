import {
  BridgeBackgroundAction,
  type BridgeController,
  BridgeUserAction,
  formatChainIdToCaip,
  isNativeAddress,
  type RequiredEventContextFromClient,
  UnifiedSwapBridgeEventName,
  formatChainIdToHex,
} from '@metamask/bridge-controller';
import { type Hex } from '@metamask/utils';
import { zeroAddress } from 'ethereumjs-util';
import { trace, TraceName } from '../../../shared/lib/trace';
import { forceUpdateMetamaskState } from '../../store/actions';
import { submitRequestToBackground } from '../../store/background-connection';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../../selectors/multichain-accounts/account-tree';
import type {
  MetaMaskReduxDispatch,
  MetaMaskReduxState,
} from '../../store/store';
import {
  bridgeSlice,
  setDestTokenExchangeRates,
  setDestTokenUsdExchangeRates,
  setSrcTokenExchangeRates,
  setTxAlerts,
} from './bridge';
import type { BridgeToken } from './types';
import { isNonEvmChain } from './utils';

const {
  setFromToken,
  setToToken,
  setFromTokenInputValue,
  setEVMSrcTokenBalance,
  setEVMSrcNativeBalance,
  resetInputFields,
  setSortOrder,
  setSelectedQuote,
  setWasTxDeclined,
  setSlippage,
  restoreQuoteRequestFromState,
  switchTokens,
} = bridgeSlice.actions;

export {
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
  switchTokens,
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

const getEVMBalance = async (
  accountAddress: string,
  chainId: Hex,
  address?: string,
) => {
  return async (dispatch: MetaMaskReduxDispatch) =>
    ((await dispatch(
      await callBridgeControllerMethod(
        'getBalanceAmount',
        accountAddress,
        address || zeroAddress(),
        chainId,
      ),
    )) as string) || null;
};

/**
 * This action reads the latest on chain balance for the selected token and its chain's native token
 * It also traces the balance update.
 *
 * @param token - The token to fetch the balance for
 */
export const setLatestEVMBalances = (token: BridgeToken) => {
  return async (
    dispatch: MetaMaskReduxDispatch,
    getState: () => MetaMaskReduxState,
  ) => {
    const { chainId, assetId, address } = token;

    if (isNonEvmChain(chainId)) {
      return null;
    }
    const hexChainId = formatChainIdToHex(chainId);
    const caipChainId = formatChainIdToCaip(hexChainId);
    const account = getInternalAccountBySelectedAccountGroupAndCaip(
      getState(),
      caipChainId,
    );
    if (!account?.address) {
      return null;
    }

    return await trace(
      {
        name: TraceName.BridgeBalancesUpdated,
        data: {
          chainId,
          isNative: isNativeAddress(address),
        },
        startTime: Date.now(),
      },
      async () => {
        dispatch(
          setEVMSrcTokenBalance({
            balance: await dispatch(
              await getEVMBalance(account.address, hexChainId, address),
            ),
            assetId,
          }),
        );

        dispatch(
          setEVMSrcNativeBalance({
            balance: await dispatch(
              await getEVMBalance(account.address, hexChainId),
            ),
            chainId,
          }),
        );
      },
    );
  };
};
