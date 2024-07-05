import { ExternalProvider, JsonRpcFetchFunc } from '@ethersproject/providers';
import {
  ControllerGetStateAction,
  ControllerStateChangeEvent,
  RestrictedControllerMessenger,
} from '@metamask/base-controller';
import type { ChainId } from '@metamask/controller-utils';
import { GasFeeState } from '@metamask/gas-fee-controller';
import { ProviderConfig } from '@metamask/network-controller';
import { TransactionParams } from '@metamask/transaction-controller';
import type {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { fetchTradesInfo as defaultFetchTradesInfo } from '../../../shared/lib/swaps-utils';
import SwapsController from './swaps';
import { controllerName } from './swaps.constants';

export type SwapsControllerState = {
  swapsState: {
    quotes: Record<string, Quote>;
    quotesPollingLimitEnabled: boolean;
    fetchParams:
      | (FetchTradesInfoParams & {
          metaData: FetchTradesInfoParamsMetadata;
        })
      | null;
    tokens: string[] | null;
    tradeTxId: string | null;
    approveTxId: string | null;
    quotesLastFetched: number | null;
    customMaxGas: string;
    customGasPrice: string | null;
    customMaxFeePerGas: string | null;
    customMaxPriorityFeePerGas: string | null;
    swapsUserFeeLevel: string;
    selectedAggId: string | null;
    customApproveTxData: string;
    errorKey: string;
    topAggId: string | null;
    routeState: string;
    swapsFeatureIsLive: boolean;
    saveFetchedQuotes: boolean;
    swapsQuoteRefreshTime: number;
    swapsQuotePrefetchingRefreshTime: number;
    swapsStxBatchStatusRefreshTime: number;
    swapsStxStatusDeadline?: number;
    swapsStxGetTransactionsRefreshTime: number;
    swapsStxMaxFeeMultiplier: number;
    swapsFeatureFlags: Record<string, boolean>;
  };
};

/**
 * The action that fetches the state of the {@link SwapsController}.
 */
export type SwapsControllerGetStateAction = ControllerGetStateAction<
  typeof controllerName,
  SwapsControllerState
>;

/**
 * The event that {@link SwapsController} can emit.
 */
export type SwapsControllerStateChangeEvent = ControllerStateChangeEvent<
  typeof controllerName,
  SwapsControllerState
>;

/**
 * The internal actions available to the SwapsController.
 */
export type SwapsControllerActions =
  | SwapsControllerGetStateAction
  | SwapsControllerSetTradeTxIdAction
  | SwapsControllerSetApproveTxIdAction;

/**
 * The internal events available to the SwapsController.
 */
export type SwapsControllerEvents = SwapsControllerStateChangeEvent;

/**
 * The messenger for the SwapsController.
 */
export type SwapsControllerMessenger = RestrictedControllerMessenger<
  typeof controllerName,
  SwapsControllerActions,
  SwapsControllerEvents,
  never,
  never
>;

/**
 * The action that sets the trade transaction ID in the {@link SwapsController}.
 */
export type SwapsControllerSetTradeTxIdAction = {
  type: `SwapsController:setTradeTxId`;
  handler: SwapsController['setTradeTxId'];
};

/**
 * The action that sets the approve transaction ID in the {@link SwapsController}.
 */
export type SwapsControllerSetApproveTxIdAction = {
  type: `SwapsController:setApproveTxId`;
  handler: SwapsController['setApproveTxId'];
};

export type FetchTradesInfoParams = {
  slippage: number;
  sourceToken: string;
  sourceDecimals: number;
  destinationToken: string;
  value: string;
  fromAddress: string;
  exchangeList: string;
  balanceError: boolean;
};

export type FetchTradesInfoParamsMetadata = {
  chainId: ChainId;
  sourceTokenInfo: {
    address: string;
    symbol: string;
    decimals: number;
    iconUrl?: string;
  };
  destinationTokenInfo: {
    address: string;
    symbol: string;
    decimals: number;
    iconUrl?: string;
  };
};

export type QuoteRequest = {
  chainId: number;
  destinationToken: string;
  slippage: number;
  sourceAmount: string;
  sourceToken: string;
  walletAddress: string;
};

export type SwapsControllerOptions = {
  getBufferedGasLimit: (
    params: {
      txParams: {
        value: string;
        data: string;
        to: string;
        from: string;
      };
    },
    factor: number,
  ) => Promise<{ gasLimit: string; simulationFails: boolean }>;
  provider: ExternalProvider | JsonRpcFetchFunc;
  getProviderConfig: () => ProviderConfig;
  getTokenRatesState: () => {
    marketData: Record<
      string,
      {
        [tokenAddress: string]: {
          price: number;
        };
      }
    >;
  };
  fetchTradesInfo: typeof defaultFetchTradesInfo;
  getCurrentChainId: () => ChainId;
  getLayer1GasFee: (params: {
    transactionParams: TransactionParams;
    chainId: ChainId;
  }) => Promise<string>;
  getEIP1559GasFeeEstimates: () => Promise<GasFeeState>;
  trackMetaMetricsEvent: (event: {
    event: MetaMetricsEventName;
    category: MetaMetricsEventCategory;
    properties: Record<string, string | boolean | number | null>;
  }) => void;
  messenger: SwapsControllerMessenger;
};

export type AggType = 'DEX' | 'RFQ' | 'CONTRACT' | 'CNT' | 'AGG';

export type PriceSlippage = {
  bucket: 'low' | 'medium' | 'high';
  calculationError: string;
  destinationAmountInETH: number | null;
  destinationAmountInNativeCurrency: number | null;
  ratio: number | null;
  sourceAmountInETH: number | null;
  sourceAmountInNativeCurrency: number | null;
  sourceAmountInUSD: number | null;
  destinationAmountInUSD: number | null;
};

export type Trade = {
  data: string;
  from: string;
  to: string;
  value: string;
  gas?: string;
};

export type QuoteSavings = {
  performance: string;
  fee: string;
  metaMaskFee: string;
  medianMetaMaskFee: string;
  total: string;
};
export type Quote = {
  aggregator: string;
  aggType: AggType;
  approvalNeeded?: Trade | null;
  averageGas: number;
  destinationAmount: string | null;
  destinationToken: string;
  destinationTokenInfo: {
    address: string;
    symbol: string;
    decimals: number;
    iconUrl?: string;
  };
  destinationTokenRate: number | null;
  error: null | string;
  estimatedRefund: string;
  ethFee: string;
  ethValueOfTokens: string;
  fee: number;
  fetchTime: number;
  gasEstimate: string;
  gasEstimateWithRefund: string;
  gasMultiplier: number;
  hasRoute: boolean;
  isBestQuote?: boolean;
  maxGas: number;
  metaMaskFeeInEth: string;
  multiLayerL1TradeFeeTotal?: string;
  overallValueOfQuote: string;
  priceSlippage: PriceSlippage;
  quoteRefreshSeconds: number;
  savings?: QuoteSavings;
  sourceAmount: string;
  sourceToken: string;
  sourceTokenRate: number;
  trade: null | Trade;
};
