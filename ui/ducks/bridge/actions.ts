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
  upsertNetworkConfiguration,
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
  getIsBridgeEnabled,
  getNetworkConfigurations,
  getSelectedNetworkClientId,
} from '../../selectors';
import { getGasFeeEstimates } from '../metamask/metamask';
import {
  addHexes,
  decGWEIToHexWEI,
} from '../../../shared/modules/conversion.utils';
import { FEATURED_RPCS } from '../../../shared/constants/network';
import { MetaMetricsNetworkEventSource } from '../../../shared/constants/metametrics';
import { DEFAULT_TOKEN_ADDRESS } from '../../../shared/constants/swaps';
import { bridgeSlice } from './bridge';
import {
  DUMMY_QUOTES_APPROVAL,
  DUMMY_QUOTES_NO_APPROVAL,
} from './dummy-quotes';

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
    const isBridgeEnabled = getIsBridgeEnabled(state);

    if (!isBridgeEnabled) {
      // TODO do we want to do something here?
      return;
    }

    const quoteMeta = DUMMY_QUOTES_APPROVAL[0]; // TODO: actually use live quotes
    // const quoteMeta = DUMMY_QUOTES_NO_APPROVAL[0]; // TODO: actually use live quotes

    // Track event TODO

    // Calc gas
    let maxFeePerGas: undefined | string;
    let maxPriorityFeePerGas: undefined | string;
    // let baseAndPriorityFeePerGas;
    // let decEstimatedBaseFee;

    const networkAndAccountSupports1559 =
      checkNetworkAndAccountSupports1559(state);

    if (networkAndAccountSupports1559) {
      const {
        high: { suggestedMaxFeePerGas, suggestedMaxPriorityFeePerGas },
        // estimatedBaseFee = '0',
      } = getGasFeeEstimates(state);
      // decEstimatedBaseFee = decGWEIToHexWEI(estimatedBaseFee);
      maxFeePerGas = decGWEIToHexWEI(suggestedMaxFeePerGas);
      maxPriorityFeePerGas = decGWEIToHexWEI(suggestedMaxPriorityFeePerGas);
      // baseAndPriorityFeePerGas = addHexes(
      //   decEstimatedBaseFee,
      //   maxPriorityFeePerGas,
      // );
    }

    const handleUSDTAllowanceReset = () => {
      const;
    };

    const handleApprovalTx = async () => {
      console.log('Bridge', 'handleApprovalTx');

      const hexChainId = new Numeric(
        quoteMeta.approval.chainId,
        10,
      ).toPrefixedHexString() as `0x${string}`;
      if (!hexChainId) {
        throw new Error('Invalid chain ID');
      }

      const gasLimit = quoteMeta.approval.gasLimit.toString();
      const txParams = {
        ...quoteMeta.approval,
        chainId: hexChainId,
        gasLimit,
        gas: gasLimit, // must set this field
        maxFeePerGas,
        maxPriorityFeePerGas,
      };
      const txMeta = await addTransactionAndWaitForPublish(txParams, {
        requireApproval: false,
        // @ts-expect-error Need TransactionController v37+, TODO add this type
        type: 'bridgeApproval', // TransactionType.bridgeApproval,

        // TODO update TransactionController to change this to a bridge field
        // swaps.meta is of type Partial<TransactionMeta>, will get merged with TransactionMeta by the TransactionController
        swaps: {
          hasApproveTx: true,
          meta: {
            type: 'bridgeApproval', // TransactionType.bridgeApproval, // TODO
            sourceTokenSymbol: quoteMeta.quote.srcAsset.symbol,
          },
        },
      });

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

      const gasLimit = quoteMeta.trade.gasLimit.toString();
      const txParams = {
        ...quoteMeta.trade,
        chainId: hexChainId,
        gasLimit,
        gas: gasLimit, // must set this field
        maxFeePerGas,
        maxPriorityFeePerGas,
      };
      const txMeta = await addTransactionAndWaitForPublish(txParams, {
        requireApproval: false,
        // @ts-expect-error Need TransactionController v37+, TODO add this type
        type: 'bridge', // TransactionType.bridge,

        // TODO update TransactionController to change this to a bridge field
        swaps: {
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
      });

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
      const {
        address,
        decimals,
        symbol,
        icon: image,
      } = quoteMeta.quote.destAsset;

      if (destNetworkConfig) {
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
        const featuredRpc = FEATURED_RPCS.find(
          (rpc) => rpc.chainId === hexDestChainId,
        );
        if (!featuredRpc) {
          throw new Error('No featured RPC found');
        }

        const { rpcUrl, nickname, rpcPrefs, ticker } = featuredRpc;
        dispatch(
          upsertNetworkConfiguration(
            {
              rpcUrl,
              chainId: hexDestChainId,
              nickname,
              rpcPrefs,
              ticker,
            },
            {
              setActive: false,
              source: MetaMetricsNetworkEventSource.Bridge,
            },
          ),
        );
      }
    };

    const execute = async () => {
      // Execute transaction(s)
      let approvalTxId: string | undefined;
      if (quoteMeta?.approval) {
        approvalTxId = await handleApprovalTx();
      }
      await handleBridgeTx(approvalTxId);

      // Add tokens if not the native gas token
      if (quoteMeta.quote.srcAsset.address !== DEFAULT_TOKEN_ADDRESS) {
        addSourceToken();
      }
      if (quoteMeta.quote.destAsset.address !== DEFAULT_TOKEN_ADDRESS) {
        addDestToken();
      }

      // Return user to home screen
      history.push(DEFAULT_ROUTE);
    };

    await execute();
  };
};
