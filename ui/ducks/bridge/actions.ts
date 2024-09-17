// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { Hex } from '@metamask/utils';
import { zeroAddress } from 'ethereumjs-util';
import { TransactionType } from '@metamask/transaction-controller';
import {
  BridgeBackgroundAction,
  BridgeUserAction,
  // TODO: Remove restricted import
  // eslint-disable-next-line import/no-restricted-paths
} from '../../../app/scripts/controllers/bridge/types';
import {
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
import { bridgeSlice } from './bridge';

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
export const signBridgeTransaction = () => {
  return async (
    dispatch: MetaMaskReduxDispatch,
    getState: () => MetaMaskReduxState,
  ) => {
    // const state = getState();

    // Check feature flags to see if enabled

    // const bestQuote = DUMMY_QUOTES_APPROVAL[0]; // TODO: actually use live quotes
    const bestQuote = DUMMY_QUOTES_NO_APPROVAL[0]; // TODO: actually use live quotes

    // Track event: bridgeStarted
    // trackEvent({

    // })

    // Approval tx
    const handleApprovalTx = async () => {
      console.log('Bridge', 'handleApprovalTx');

      const hexChainId = new Numeric(bestQuote.approval.chainId, 10)
        .toPrefixedHexString()
        .toString() as `0x${string}`;
      if (!hexChainId) {
        throw new Error('Invalid chain ID');
      }

      const { id: approvalTxId } = await addTransactionAndWaitForPublish(
        {
          ...bestQuote.approval,
          chainId: hexChainId,
          gasLimit: bestQuote.approval.gasLimit.toString(),
        },
        {
          requireApproval: false,
          // @ts-expect-error Need TransactionController v37+, TODO add this type
          type: 'bridgeApproval', // TransactionType.bridgeApproval,
          swaps: {
            hasApproveTx: true,
            meta: {
              type: 'bridgeApproval', // TransactionType.bridgeApproval, // TODO
              sourceTokenSymbol: bestQuote.quote.srcAsset.symbol,
            },
          },
        },
      );

      console.log('Bridge', { approvalTxId });
      return approvalTxId;
    };

    // The actual bridge tx
    const handleBridgeTx = async (approvalTxId: string | undefined) => {
      console.log('Bridge', 'handleBridgeTx');
      const hexChainId = new Numeric(bestQuote.trade.chainId, 10)
        .toPrefixedHexString()
        .toString() as `0x${string}`;
      if (!hexChainId) {
        throw new Error('Invalid chain ID');
      }

      const { id: bridgeTxId } = await addTransactionAndWaitForPublish(
        {
          ...bestQuote.trade,
          chainId: hexChainId,
          gasLimit: bestQuote.trade.gasLimit.toString(),
        },
        {
          requireApproval: false,
          // @ts-expect-error Need TransactionController v37+, TODO add this type
          type: 'bridge', // TransactionType.bridge,
          swaps: {
            hasApproveTx: Boolean(bestQuote?.approval),
            meta: {
              // estimatedBaseFee: decEstimatedBaseFee,
              // swapMetaData,
              type: 'bridge', // TransactionType.bridge, // TODO add this type
              sourceTokenSymbol: bestQuote.quote.srcAsset.symbol,
              destinationTokenSymbol: bestQuote.quote.destAsset.symbol,
              destinationTokenDecimals: bestQuote.quote.destAsset.decimals,
              destinationTokenAddress: bestQuote.quote.destAsset.address,
              approvalTxId,
              // this is the decimal (non atomic) amount (not USD value) of source token to swap
              swapTokenValue: new Numeric(
                bestQuote.quote.srcTokenAmount,
                10,
              ).shiftedBy(bestQuote.quote.srcAsset.decimals),
            },
          },
        },
      );

      console.log('Bridge', { bridgeTxId });
      return bridgeTxId;
    };

    let approvalTxId: string | undefined;
    if (bestQuote?.approval) {
      approvalTxId = await handleApprovalTx();
    }

    const bridgeTxId = await handleBridgeTx(approvalTxId);
  };
};
