// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { Hex } from '@metamask/utils';
import { zeroAddress } from 'ethereumjs-util';
import { useHistory } from 'react-router-dom';
import { BigNumber } from 'bignumber.js';
import { NetworkConfiguration } from '@metamask/network-controller';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
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
  addNetwork,
  setDefaultHomeActiveTabName,
} from '../../store/actions';
import { submitRequestToBackground } from '../../store/background-connection';
import {
  ChainId,
  FeeType,
  QuoteRequest,
  QuoteResponse,
  TxData,
} from '../../pages/bridge/types';
import { Numeric } from '../../../shared/modules/Numeric';
import {
  checkNetworkAndAccountSupports1559,
  getNetworkConfigurationsByChainId,
  getSelectedNetworkClientId,
} from '../../selectors';
import { MetaMaskReduxDispatch, MetaMaskReduxState } from '../../store/store';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import { getGasFeeEstimates } from '../metamask/metamask';
import { decGWEIToHexWEI } from '../../../shared/modules/conversion.utils';
import { FEATURED_RPCS } from '../../../shared/constants/network';
import { getEthUsdtResetData, isEthUsdt } from '../../pages/bridge/bridge.util';
import { ETH_USDT_ADDRESS } from '../../../shared/constants/bridge';
import { getTransaction1559GasFeeEstimates } from '../../pages/swaps/swaps.util';
import { bridgeSlice } from './bridge';
import { BridgeAppState } from './selectors';

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

export const getBridgeERC20Allowance = async (
  contractAddress: string,
  chainId: Hex,
): Promise<string> => {
  return await submitRequestToBackground(
    BridgeBackgroundAction.GET_BRIDGE_ERC20_ALLOWANCE,
    [contractAddress, chainId],
  );
};

// We don't need to use gas multipliers here because the gasLimit from Bridge API already included it
const getHexMaxGasLimit = (gasLimit: number) => {
  return new Numeric(
    new BigNumber(gasLimit).toString(),
    10,
  ).toPrefixedHexString() as Hex;
};

const getTxGasEstimates = async ({
  networkAndAccountSupports1559,
  networkGasFeeEstimates,
  txParams,
  hexChainId,
}: {
  networkAndAccountSupports1559: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  networkGasFeeEstimates: any;
  txParams: TxData;
  hexChainId: Hex;
}) => {
  if (networkAndAccountSupports1559) {
    const { estimatedBaseFeeGwei = '0' } = networkGasFeeEstimates;
    const hexEstimatedBaseFee = decGWEIToHexWEI(estimatedBaseFeeGwei) as Hex;
    return await getTransaction1559GasFeeEstimates(
      {
        ...txParams,
        chainId: hexChainId,
        gasLimit: txParams.gasLimit?.toString(),
      },
      hexEstimatedBaseFee,
      hexChainId,
    );
  }

  return {
    baseAndPriorityFeePerGas: undefined,
    maxFeePerGas: undefined,
    maxPriorityFeePerGas: undefined,
  };
};

export const submitBridgeTransaction = (
  quoteResponse: QuoteResponse,
  history: ReturnType<typeof useHistory>,
) => {
  return async (
    dispatch: MetaMaskReduxDispatch,
    getState: () => MetaMaskReduxState & BridgeAppState,
  ) => {
    const state = getState();
    const networkAndAccountSupports1559 =
      checkNetworkAndAccountSupports1559(state);
    const networkGasFeeEstimates = getGasFeeEstimates(state);

    const handleTx = async ({
      txType,
      txParams,
      meta,
    }: {
      txType: TransactionType.bridgeApproval | TransactionType.bridge;
      txParams: {
        chainId: ChainId;
        to: string;
        from: string;
        value: string;
        data: string;
        gasLimit: number | null;
      };
      meta: Partial<TransactionMeta>; // all fields in meta are merged with TransactionMeta downstream
    }) => {
      const hexChainId = new Numeric(
        txParams.chainId,
        10,
      ).toPrefixedHexString() as `0x${string}`;

      const { maxFeePerGas, maxPriorityFeePerGas } = await getTxGasEstimates({
        networkAndAccountSupports1559,
        networkGasFeeEstimates,
        txParams,
        hexChainId,
      });
      const maxGasLimit = getHexMaxGasLimit(txParams.gasLimit ?? 0);

      const finalTxParams = {
        ...txParams,
        chainId: hexChainId,
        gasLimit: maxGasLimit,
        gas: maxGasLimit,
        maxFeePerGas,
        maxPriorityFeePerGas,
      };

      const txMeta = await addTransactionAndWaitForPublish(finalTxParams, {
        requireApproval: false,
        type: txType,
        swaps: {
          hasApproveTx:
            txType === TransactionType.bridge
              ? Boolean(quoteResponse?.approval)
              : true,
          meta,
        },
      });

      await forceUpdateMetamaskState(dispatch);

      return txMeta;
    };

    const handleEthUsdtAllowanceReset = async ({
      approval,
      hexChainId,
    }: {
      approval: TxData;
      hexChainId: Hex;
    }) => {
      const allowance = new BigNumber(
        await getBridgeERC20Allowance(ETH_USDT_ADDRESS, hexChainId),
      );

      // quote.srcTokenAmount is actually after the fees
      // so we need to add fees back in for total allowance to give
      const sentAmount = new BigNumber(quoteResponse.quote.srcTokenAmount)
        .plus(quoteResponse.quote.feeData[FeeType.METABRIDGE].amount)
        .toString();

      const shouldResetApproval = allowance.lt(sentAmount) && allowance.gt(0);

      if (shouldResetApproval) {
        const resetData = getEthUsdtResetData();
        const txParams = {
          ...approval,
          data: resetData,
        };

        await handleTx({
          txType: TransactionType.bridgeApproval,
          txParams,
          meta: {
            type: TransactionType.bridgeApproval,
          },
        });
      }
    };

    const handleApprovalTx = async ({ approval }: { approval: TxData }) => {
      const hexChainId = new Numeric(
        approval.chainId,
        10,
      ).toPrefixedHexString() as `0x${string}`;

      // On Ethereum, we need to reset the allowance to 0 for USDT first if we need to set a new allowance
      // https://www.google.com/url?q=https://docs.unizen.io/trade-api/before-you-get-started/token-allowance-management-for-non-updatable-allowance-tokens&sa=D&source=docs&ust=1727386175513609&usg=AOvVaw3Opm6BSJeu7qO0Ve5iLTOh
      if (isEthUsdt(hexChainId, quoteResponse.quote.srcAsset.address)) {
        await handleEthUsdtAllowanceReset({
          approval,
          hexChainId,
        });
      }

      const txMeta = await handleTx({
        txType: TransactionType.bridgeApproval,
        txParams: approval,
        meta: {
          type: TransactionType.bridgeApproval,
          sourceTokenSymbol: quoteResponse.quote.srcAsset.symbol,
        },
      });

      return txMeta.id;
    };

    const handleBridgeTx = async ({
      approvalTxId,
    }: {
      approvalTxId: string | undefined;
    }) => {
      const sentAmount = new BigNumber(quoteResponse.quote.srcTokenAmount).plus(
        quoteResponse.quote.feeData[FeeType.METABRIDGE].amount,
      );
      const sentAmountDec = new Numeric(sentAmount, 10)
        .shiftedBy(quoteResponse.quote.srcAsset.decimals)
        .toString();

      const txMeta = await handleTx({
        txType: TransactionType.bridge,
        txParams: quoteResponse.trade,
        meta: {
          // estimatedBaseFee: decEstimatedBaseFee,
          // swapMetaData,
          type: TransactionType.bridge,
          sourceTokenSymbol: quoteResponse.quote.srcAsset.symbol,
          destinationTokenSymbol: quoteResponse.quote.destAsset.symbol,
          destinationTokenDecimals: quoteResponse.quote.destAsset.decimals,
          destinationTokenAddress: quoteResponse.quote.destAsset.address,
          approvalTxId,
          // this is the decimal (non atomic) amount (not USD value) of source token to swap
          swapTokenValue: sentAmountDec,
        },
      });

      return txMeta.id;
    };

    const addSourceToken = () => {
      const sourceNetworkClientId: string = getSelectedNetworkClientId(state);
      const {
        address,
        decimals,
        symbol,
        icon: image,
      } = quoteResponse.quote.srcAsset;
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

    const addDestToken = async () => {
      // Look up the destination chain
      const hexDestChainId = new Numeric(quoteResponse.quote.destChainId, 10)
        .toPrefixedHexString()
        .toLowerCase() as `0x${string}`;
      const networkConfigurations = getNetworkConfigurationsByChainId(state);
      const foundDestNetworkConfig: NetworkConfiguration | undefined =
        networkConfigurations[hexDestChainId];
      let addedDestNetworkConfig: NetworkConfiguration | undefined;

      // If user has not added the network in MetaMask, add it for them silently
      if (!foundDestNetworkConfig) {
        const featuredRpc = FEATURED_RPCS.find(
          (rpc) => rpc.chainId === hexDestChainId,
        );
        if (!featuredRpc) {
          throw new Error('No featured RPC found');
        }
        addedDestNetworkConfig = await dispatch(addNetwork(featuredRpc));
      }

      const destNetworkConfig =
        foundDestNetworkConfig || addedDestNetworkConfig;
      if (!destNetworkConfig) {
        throw new Error('No destination network configuration found');
      }

      // Add the token after network is guaranteed to exist
      const rpcEndpointIndex = destNetworkConfig.defaultRpcEndpointIndex;
      const destNetworkClientId =
        destNetworkConfig.rpcEndpoints[rpcEndpointIndex].networkClientId;
      const {
        address,
        decimals,
        symbol,
        icon: image,
      } = quoteResponse.quote.destAsset;
      await dispatch(
        addToken({
          address,
          decimals,
          symbol,
          image,
          networkClientId: destNetworkClientId,
        }),
      );
    };

    const execute = async () => {
      // Execute transaction(s)
      let approvalTxId: string | undefined;
      if (quoteResponse?.approval) {
        approvalTxId = await handleApprovalTx({
          approval: quoteResponse.approval,
        });
      }

      await handleBridgeTx({
        approvalTxId,
      });

      // Add tokens if not the native gas token
      if (quoteResponse.quote.srcAsset.address !== zeroAddress()) {
        addSourceToken();
      }
      if (quoteResponse.quote.destAsset.address !== zeroAddress()) {
        await addDestToken();
      }

      // Route user to activity tab on Home page
      await dispatch(setDefaultHomeActiveTabName('activity'));
      history.push(DEFAULT_ROUTE);
    };

    await execute();
  };
};
