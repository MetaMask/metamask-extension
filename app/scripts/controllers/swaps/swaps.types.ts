import { ExternalProvider, JsonRpcFetchFunc } from '@ethersproject/providers';
import { TokenRatesControllerGetStateAction } from '@metamask/assets-controllers';
import {
  ControllerGetStateAction,
  ControllerStateChangeEvent,
  RestrictedControllerMessenger,
} from '@metamask/base-controller';
import type { ChainId } from '@metamask/controller-utils';
import { GasFeeState } from '@metamask/gas-fee-controller';
import {
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetStateAction,
} from '@metamask/network-controller';
import { TransactionParams } from '@metamask/transaction-controller';
import type {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { fetchTradesInfo as defaultFetchTradesInfo } from '../../../../shared/lib/swaps-utils';
import { controllerName } from './swaps.constants';
import SwapsController from '.';

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
 * The external actions available to the {@link SwapsController}.
 */
export type AllowedActions =
  | NetworkControllerGetStateAction
  | NetworkControllerGetNetworkClientByIdAction
  | TokenRatesControllerGetStateAction;

/**
 * The internal actions available to the SwapsController.
 */
export type SwapsControllerActions =
  | SwapsControllerGetStateAction
  | SwapsControllerFetchAndSetQuotesAction
  | SwapsControllerSetSelectedQuoteAggIdAction
  | SwapsControllerResetSwapsStateAction
  | SwapsControllerSetSwapsTokensAction
  | SwapsControllerClearSwapsQuotesAction
  | SwapsControllerSetApproveTxIdAction
  | SwapsControllerSetTradeTxIdAction
  | SwapsControllerSetSwapsTxGasPriceAction
  | SwapsControllerSetSwapsTxGasLimitAction
  | SwapsControllerSetSwapsTxMaxFeePerGasAction
  | SwapsControllerSetSwapsTxMaxFeePriorityPerGasAction
  | SwapsControllerSafeRefetchQuotesAction
  | SwapsControllerStopPollingForQuotesAction
  | SwapsControllerSetBackgroundSwapRouteStateAction
  | SwapsControllerResetPostFetchStateAction
  | SwapsControllerSetSwapsErrorKeyAction
  | SwapsControllerSetInitialGasEstimateAction
  | SwapsControllerSetCustomApproveTxDataAction
  | SwapsControllerSetSwapsLivenessAction
  | SwapsControllerSetSwapsFeatureFlagsAction
  | SwapsControllerSetSwapsUserFeeLevelAction
  | SwapsControllerSetSwapsQuotesPollingLimitEnabledAction;

/**
 * The internal events available to the SwapsController.
 */
export type SwapsControllerEvents = SwapsControllerStateChangeEvent;

/**
 * The messenger for the SwapsController.
 */
export type SwapsControllerMessenger = RestrictedControllerMessenger<
  typeof controllerName,
  SwapsControllerActions | AllowedActions,
  SwapsControllerEvents,
  AllowedActions['type'],
  never
>;

/**
 * The action that fetches and sets quotes in the {@link SwapsController}.
 */
export type SwapsControllerFetchAndSetQuotesAction = {
  type: `SwapsController:fetchAndSetQuotes`;
  handler: SwapsController['fetchAndSetQuotes'];
};

/**
 * The action that sets the selected quote aggregation ID in the {@link SwapsController}.
 */
export type SwapsControllerSetSelectedQuoteAggIdAction = {
  type: `SwapsController:setSelectedQuoteAggId`;
  handler: SwapsController['setSelectedQuoteAggId'];
};

/**
 * The action that resets the swaps state in the {@link SwapsController}.
 */
export type SwapsControllerResetSwapsStateAction = {
  type: `SwapsController:resetSwapsState`;
  handler: SwapsController['resetSwapsState'];
};

/**
 * The action that sets the swaps tokens in the {@link SwapsController}.
 */
export type SwapsControllerSetSwapsTokensAction = {
  type: `SwapsController:setSwapsTokens`;
  handler: SwapsController['setSwapsTokens'];
};

/**
 * The action that clears the swaps quotes in the {@link SwapsController}.
 */
export type SwapsControllerClearSwapsQuotesAction = {
  type: `SwapsController:clearSwapsQuotes`;
  handler: SwapsController['clearSwapsQuotes'];
};

/**
 * The action that sets the approve transaction ID in the {@link SwapsController}.
 */
export type SwapsControllerSetApproveTxIdAction = {
  type: `SwapsController:setApproveTxId`;
  handler: SwapsController['setApproveTxId'];
};

/**
 * The action that sets the trade transaction ID in the {@link SwapsController}.
 */
export type SwapsControllerSetTradeTxIdAction = {
  type: `SwapsController:setTradeTxId`;
  handler: SwapsController['setTradeTxId'];
};

/**
 * The action that sets the swaps transaction gas price in the {@link SwapsController}.
 */
export type SwapsControllerSetSwapsTxGasPriceAction = {
  type: `SwapsController:setSwapsTxGasPrice`;
  handler: SwapsController['setSwapsTxGasPrice'];
};

/**
 * The action that sets the swaps transaction gas limit in the {@link SwapsController}.
 */
export type SwapsControllerSetSwapsTxGasLimitAction = {
  type: `SwapsController:setSwapsTxGasLimit`;
  handler: SwapsController['setSwapsTxGasLimit'];
};

/**
 * The action that sets the swaps transaction max fee per gas in the {@link SwapsController}.
 */
export type SwapsControllerSetSwapsTxMaxFeePerGasAction = {
  type: `SwapsController:setSwapsTxMaxFeePerGas`;
  handler: SwapsController['setSwapsTxMaxFeePerGas'];
};

/**
 * The action that sets the swaps transaction max fee priority per gas in the {@link SwapsController}.
 */
export type SwapsControllerSetSwapsTxMaxFeePriorityPerGasAction = {
  type: `SwapsController:setSwapsTxMaxFeePriorityPerGas`;
  handler: SwapsController['setSwapsTxMaxFeePriorityPerGas'];
};

/**
 * The action that safely refetches quotes in the {@link SwapsController}.
 */
export type SwapsControllerSafeRefetchQuotesAction = {
  type: `SwapsController:safeRefetchQuotes`;
  handler: SwapsController['safeRefetchQuotes'];
};

/**
 * The action that stops polling for quotes in the {@link SwapsController}.
 */
export type SwapsControllerStopPollingForQuotesAction = {
  type: `SwapsController:stopPollingForQuotes`;
  handler: SwapsController['stopPollingForQuotes'];
};

/**
 * The action that sets the background swap route state in the {@link SwapsController}.
 */
export type SwapsControllerSetBackgroundSwapRouteStateAction = {
  type: `SwapsController:setBackgroundSwapRouteState`;
  handler: SwapsController['setBackgroundSwapRouteState'];
};

/**
 * The action that resets the post-fetch state in the {@link SwapsController}.
 */
export type SwapsControllerResetPostFetchStateAction = {
  type: `SwapsController:resetPostFetchState`;
  handler: SwapsController['resetPostFetchState'];
};

/**
 * The action that sets the swaps error key in the {@link SwapsController}.
 */
export type SwapsControllerSetSwapsErrorKeyAction = {
  type: `SwapsController:setSwapsErrorKey`;
  handler: SwapsController['setSwapsErrorKey'];
};

/**
 * The action that sets the initial gas estimate in the {@link SwapsController}.
 */
export type SwapsControllerSetInitialGasEstimateAction = {
  type: `SwapsController:setInitialGasEstimate`;
  handler: SwapsController['setInitialGasEstimate'];
};

/**
 * The action that sets custom approve transaction data in the {@link SwapsController}.
 */
export type SwapsControllerSetCustomApproveTxDataAction = {
  type: `SwapsController:setCustomApproveTxData`;
  handler: SwapsController['setCustomApproveTxData'];
};

/**
 * The action that sets the swaps liveness in the {@link SwapsController}.
 */
export type SwapsControllerSetSwapsLivenessAction = {
  type: `SwapsController:setSwapsLiveness`;
  handler: SwapsController['setSwapsLiveness'];
};

/**
 * The action that sets the swaps feature flags in the {@link SwapsController}.
 */
export type SwapsControllerSetSwapsFeatureFlagsAction = {
  type: `SwapsController:setSwapsFeatureFlags`;
  handler: SwapsController['setSwapsFeatureFlags'];
};

/**
 * The action that sets the swaps user fee level in the {@link SwapsController}.
 */
export type SwapsControllerSetSwapsUserFeeLevelAction = {
  type: `SwapsController:setSwapsUserFeeLevel`;
  handler: SwapsController['setSwapsUserFeeLevel'];
};

/**
 * The action that sets the swaps quotes polling limit enabled in the {@link SwapsController}.
 */
export type SwapsControllerSetSwapsQuotesPollingLimitEnabledAction = {
  type: `SwapsController:setSwapsQuotesPollingLimitEnabled`;
  handler: SwapsController['setSwapsQuotesPollingLimitEnabled'];
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
  enableGasIncludedQuotes: boolean;
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
  fetchTradesInfo: typeof defaultFetchTradesInfo;
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
