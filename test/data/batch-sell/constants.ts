import type { CaipAssetType, CaipChainId } from '@metamask/utils';
import type { QuoteValidationErrors } from '../../../ui/ducks/bridge/types';

export const BATCH_SELL_CHAIN_ID = 'eip155:1' as CaipChainId;

export const BATCH_SELL_ASSET_IDS = {
  ETH_NATIVE: 'eip155:1/slip44:60' as CaipAssetType,
  USDC: 'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as CaipAssetType,
  USDT: 'eip155:1/erc20:0xdAC17F958D2ee523a2206206994597C13D831ec7' as CaipAssetType,
  DAI: 'eip155:1/erc20:0x6B175474E89094C44Da98b954EedeAC495271d0F' as CaipAssetType,
} as const;

/**
 * A QuoteValidationErrors instance with all flags set to false.
 * Useful as a base in tests that only care about toggling specific flags.
 */
export const noValidationErrors: QuoteValidationErrors = {
  isInsufficientGasBalance: false,
  isInsufficientNativeReserve: false,
  isNetworkFeeUnavailable: false,
  isInsufficientGasForQuote: false,
  isInsufficientBalance: false,
  isEstimatedReturnLow: false,
  isPriceImpactWarning: false,
  isPriceImpactError: false,
};

/**
 * Minimal controller state shape representing a batch-sell quote request that
 * has not yet received any data.
 */
export const BATCH_SELL_MOCK_CONTROLLER_RESULT_NOT_FETCHED = {
  recommendedQuotes: [],
  quotesLastFetchedMs: null,
  isLoading: false,
  isQuoteGoingToRefresh: false,
  quoteFetchError: null,
  quotesRefreshCount: 0,
  totalReceived: null,
  minimumReceived: null,
  quotesInitialLoadTimeMs: null,
} as const;

/**
 * Minimal controller state shape representing a batch-sell quote request that
 * has completed at least one fetch cycle.
 */
export const BATCH_SELL_MOCK_CONTROLLER_RESULT_FETCHED = {
  ...BATCH_SELL_MOCK_CONTROLLER_RESULT_NOT_FETCHED,
  quotesLastFetchedMs: 1234567890,
} as const;
