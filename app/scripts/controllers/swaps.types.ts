import { fetchTradesInfo as defaultFetchTradesInfo } from '../../../shared/lib/swaps-utils';

import type { ChainId } from '@metamask/controller-utils';
import type { ObservableStore } from '@metamask/obs-store';
import type { GasEstimateTypes } from '../../../shared/constants/gas';
import type {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';

export type SwapsControllerStore = ObservableStore<{
  swapsState: SwapsControllerState;
}>;

export interface SwapsControllerState {
  quotes: Record<string, any>;
  quotesPollingLimitEnabled: boolean;
  fetchParams: any;
  tokens: any;
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
  swapsStxStatusDeadline: number;
  swapsStxGetTransactionsRefreshTime: number;
  swapsStxMaxFeeMultiplier: number;
  swapsFeatureFlags: Record<string, boolean>;
}

export interface SwapsControllerOptions {
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
  provider: any;
  getProviderConfig: () => any;
  getTokenRatesState: () => any;
  fetchTradesInfo: typeof defaultFetchTradesInfo;
  getCurrentChainId: () => ChainId;
  getLayer1GasFee: (params: {
    transactionParams: any;
    chainId: string;
  }) => Promise<string>;
  getEIP1559GasFeeEstimates: () => Promise<{
    gasFeeEstimates: any;
    gasEstimateType: GasEstimateTypes;
  }>;
  trackMetaMetricsEvent: (event: {
    event: MetaMetricsEventName;
    category: MetaMetricsEventCategory;
    properties: Record<string, any>;
  }) => void;
}

export interface FetchTradesInfoParams {
  slippage: number;
  sourceToken: any;
  sourceDecimals: any;
  destinationToken: any;
  value: any;
  fromAddress: any;
  exchangeList: any;
  balanceError: boolean;
}

export interface FetchTradesInfoParamsMetadata {
  chainId: ChainId;
  sourceTokenInfo: any;
  destinationTokenInfo: any;
}

export interface QuoteRequest {
  chainId: number;
  destinationToken: string;
  slippage: number;
  sourceAmount: string;
  sourceToken: string;
  walletAddress: string;
}

export type AggType = 'DEX' | 'RFQ' | 'CONTRACT' | 'CNT' | 'AGG';

export interface PriceSlippage {
  bucket: 'low' | 'medium' | 'high';
  calculationError: string;
  destinationAmountInETH: number | null;
  destinationAmountInNativeCurrency: number | null;
  ratio: number | null;
  sourceAmountInETH: number | null;
  sourceAmountInNativeCurrency: number | null;
  sourceAmountInUSD: number | null;
  destinationAmountInUSD: number | null;
}

export interface Trade {
  data: string;
  from: string;
  to: string;
  value: string;
  gas?: string;
}

export interface QuoteSavings {
  performance: string;
  fee: string;
  metaMaskFee: string;
  medianMetaMaskFee: string;
  total: string;
}
export interface Quote {
  aggregator: string;
  aggType: AggType;
  approvalNeeded?: Trade | null;
  averageGas: number;
  destinationAmount: string | null;
  destinationToken: string | null;
  destinationTokenInfo: any;
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
  isBestQuote: boolean;
  maxGas: number;
  metaMaskFeeInEth: string;
  multiLayerL1TradeFeeTotal?: string;
  overallValueOfQuote: string;
  priceSlippage: PriceSlippage;
  quoteRefreshSeconds: number;
  route?: any;
  savings?: QuoteSavings;
  sourceAmount: string;
  sourceToken: string;
  sourceTokenRate: number;
  trade: null | Trade;
}

export interface QuoteWithTrade extends Quote {
  destinationAmount: string;
  destinationToken: string;
  destinationTokenRate: number;
  trade: Trade;
}
