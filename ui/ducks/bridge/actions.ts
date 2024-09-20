// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { Hex } from '@metamask/utils';
import { zeroAddress } from 'ethereumjs-util';
import { TransactionType } from '@metamask/transaction-controller';
import { useHistory } from 'react-router-dom';
import {
  BridgeBackgroundAction,
  BridgeUserAction,
  // TODO: Remove restricted import
  // eslint-disable-next-line import/no-restricted-paths
} from '../../../app/scripts/controllers/bridge/types';
import {
  addToken,
  addTransactionAndWaitForPublish,
  forceUpdateMetamaskState,
} from '../../store/actions';
import { submitRequestToBackground } from '../../store/background-connection';
import { QuoteRequest } from '../../pages/bridge/types';
import {
  AssetWithDisplayData,
  ERC20Asset,
  NativeAsset,
} from '../../components/multichain/asset-picker-amount/asset-picker-modal/types';
import { Numeric } from '../../../shared/modules/Numeric';
import { SwapsTokenObject } from '../../../shared/constants/swaps';
import { SwapsEthToken } from '../../selectors';
import { MetaMaskReduxDispatch, MetaMaskReduxState } from '../../store/store';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import {
  checkNetworkAndAccountSupports1559,
  getNetworkConfigurations,
  getSelectedNetworkClientId,
} from '../../selectors';
import { getGasFeeEstimates } from '../metamask/metamask';
import {
  addHexes,
  decGWEIToHexWEI,
} from '../../../shared/modules/conversion.utils';
import {
  getCustomMaxFeePerGas,
  getCustomMaxPriorityFeePerGas,
} from '../swaps/swaps';
import { bridgeSlice } from './bridge';
import { DUMMY_QUOTES_APPROVAL } from './dummy-quotes';

const {
  setToChainId,
  setFromToken,
  setToToken,
  setFromTokenInputValue,
  resetInputFields,
} = bridgeSlice.actions;

export {
  setToChainId,
  resetInputFields,
  setToToken,
  setFromToken,
  setFromTokenInputValue,
};

const callBridgeControllerMethod = <T>(
  bridgeAction: BridgeUserAction | BridgeBackgroundAction,
  args?: T,
) => {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await submitRequestToBackground(bridgeAction, [args]);
    await forceUpdateMetamaskState(dispatch);
  };
};

// Background actions
export const setBridgeFeatureFlags = () => {
  return async (dispatch: MetaMaskReduxDispatch) => {
    return dispatch(
      callBridgeControllerMethod(BridgeBackgroundAction.SET_FEATURE_FLAGS),
    );
  };
};

export const resetBridgeState = () => {
  return async (dispatch: MetaMaskReduxDispatch) => {
    dispatch(resetInputFields());
    dispatch(callBridgeControllerMethod(BridgeBackgroundAction.RESET_STATE));
  };
};

// User actions
export const setFromChain = (chainId: Hex) => {
  return async (dispatch: MetaMaskReduxDispatch) => {
    dispatch(
      callBridgeControllerMethod<Hex>(
        BridgeUserAction.SELECT_SRC_NETWORK,
        chainId,
      ),
    );
  };
};

export const setToChain = (chainId: Hex) => {
  return async (dispatch: MetaMaskReduxDispatch) => {
    dispatch(
      callBridgeControllerMethod<Hex>(
        BridgeUserAction.SELECT_DEST_NETWORK,
        chainId,
      ),
    );
  };
};

export const updateQuoteRequestParams = (params: Partial<QuoteRequest>) => {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await dispatch(
      callBridgeControllerMethod(BridgeUserAction.UPDATE_QUOTE_PARAMS, params),
    );
  };
};
export const signBridgeTransaction = (
  history: ReturnType<typeof useHistory>,
) => {
  return async (
    dispatch: MetaMaskReduxDispatch,
    getState: () => MetaMaskReduxState,
  ) => {
    const state = getState();

    // TODO Check feature flags to see if enabled
    // if (!isLive) {
    //   history.push(BRIDGE_MAINTENANCE_ROUTE);
    //   return;
    // }

    const quoteMeta = DUMMY_QUOTES_APPROVAL[0]; // TODO: actually use live quotes
    // const quoteMeta = DUMMY_QUOTES_NO_APPROVAL[0]; // TODO: actually use live quotes

    // Track event TODO

    let maxFeePerGas;
    let maxPriorityFeePerGas;
    let baseAndPriorityFeePerGas;
    let decEstimatedBaseFee;

    const networkAndAccountSupports1559 =
      checkNetworkAndAccountSupports1559(state);
    const customMaxFeePerGas = getCustomMaxFeePerGas(state);
    const customMaxPriorityFeePerGas = getCustomMaxPriorityFeePerGas(state);

    if (networkAndAccountSupports1559) {
      const {
        high: { suggestedMaxFeePerGas, suggestedMaxPriorityFeePerGas },
        estimatedBaseFee = '0',
      } = getGasFeeEstimates(state);
      decEstimatedBaseFee = decGWEIToHexWEI(estimatedBaseFee);
      maxFeePerGas =
        customMaxFeePerGas || decGWEIToHexWEI(suggestedMaxFeePerGas);
      maxPriorityFeePerGas =
        customMaxPriorityFeePerGas ||
        decGWEIToHexWEI(suggestedMaxPriorityFeePerGas);
      baseAndPriorityFeePerGas = addHexes(
        decEstimatedBaseFee,
        maxPriorityFeePerGas,
      );
    }

    const handleApprovalTx = async () => {
      console.log('Bridge', 'handleApprovalTx');

      const hexChainId = new Numeric(
        quoteMeta.approval.chainId,
        10,
      ).toPrefixedHexString() as `0x${string}`;
      if (!hexChainId) {
        throw new Error('Invalid chain ID');
      }

      const txMeta = await addTransactionAndWaitForPublish(
        {
          ...quoteMeta.approval,
          chainId: hexChainId,
          gasLimit: quoteMeta.approval.gasLimit.toString(),
          // maxFeePerGas,
          // maxPriorityFeePerGas,
        },
        {
          requireApproval: false,
          // @ts-expect-error Need TransactionController v37+, TODO add this type
          type: 'bridgeApproval', // TransactionType.bridgeApproval,
          swaps: {
            hasApproveTx: true,
            meta: {
              type: 'bridgeApproval', // TransactionType.bridgeApproval, // TODO
              sourceTokenSymbol: quoteMeta.quote.srcAsset.symbol,
            },
          },
        },
      );

      console.log('Bridge', { approvalTxId: txMeta.id });
      return txMeta.id;
    };

    const handleBridgeTx = async (approvalTxId: string | undefined) => {
      console.log('Bridge', 'handleBridgeTx');
      const hexChainId = new Numeric(
        quoteMeta.trade.chainId,
        10,
      ).toPrefixedHexString() as `0x${string}`;
      if (!hexChainId) {
        throw new Error('Invalid chain ID');
      }

      const txMeta = await addTransactionAndWaitForPublish(
        {
          ...quoteMeta.trade,
          chainId: hexChainId,
          gasLimit: quoteMeta.trade.gasLimit.toString(),
          // maxFeePerGas,
          // maxPriorityFeePerGas,
        },
        {
          requireApproval: false,
          // @ts-expect-error Need TransactionController v37+, TODO add this type
          type: 'bridge', // TransactionType.bridge,
          bridge: {
            hasApproveTx: Boolean(quoteMeta?.approval),
            meta: {
              // estimatedBaseFee: decEstimatedBaseFee,
              // swapMetaData,
              type: 'bridge', // TransactionType.bridge, // TODO add this type
              sourceTokenSymbol: quoteMeta.quote.srcAsset.symbol,
              destinationTokenSymbol: quoteMeta.quote.destAsset.symbol,
              destinationTokenDecimals: quoteMeta.quote.destAsset.decimals,
              destinationTokenAddress: quoteMeta.quote.destAsset.address,
              approvalTxId,
              // this is the decimal (non atomic) amount (not USD value) of source token to swap
              swapTokenValue: new Numeric(
                quoteMeta.quote.srcTokenAmount,
                10,
              ).shiftedBy(quoteMeta.quote.srcAsset.decimals),
            },
          },
        },
      );

      console.log('Bridge', { bridgeTxId: txMeta.id });
      return txMeta.id;
    };

    const addSourceToken = () => {
      const sourceNetworkClientId = getSelectedNetworkClientId(state);
      const {
        address,
        decimals,
        symbol,
        icon: image,
      } = quoteMeta.quote.srcAsset;
      dispatch(
        addToken({
          address,
          decimals,
          symbol,
          image,
          networkClientId: sourceNetworkClientId,
        }),
      );
    };

    const addDestToken = () => {
      const networkConfigurations = getNetworkConfigurations(state);
      const networkConfigurationsArr = Object.values<{
        chainId: Hex;
        id: string;
      }>(networkConfigurations);
      const hexDestChainId = new Numeric(
        quoteMeta.quote.destChainId,
        10,
      ).toPrefixedHexString() as `0x${string}`;
      const destNetworkConfig = networkConfigurationsArr.find(
        (networkConfig) => networkConfig.chainId === hexDestChainId,
      );
      if (destNetworkConfig) {
        const {
          address,
          decimals,
          symbol,
          icon: image,
        } = quoteMeta.quote.destAsset;
        dispatch(
          addToken({
            address,
            decimals,
            symbol,
            image,
            networkClientId: destNetworkConfig.id,
          }),
        );
      } else {
        // TODO import the dest chain, then add the dest token
      }
    };

    // Execute transaction(s)
    let approvalTxId: string | undefined;
    if (quoteMeta?.approval) {
      approvalTxId = await handleApprovalTx();
    }
    await handleBridgeTx(approvalTxId);

    // Add tokens
    addSourceToken();
    addDestToken();

    // Return user to home screen
    history.push(DEFAULT_ROUTE);
  };
};
