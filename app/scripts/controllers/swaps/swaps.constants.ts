import {
  FALLBACK_SMART_TRANSACTIONS_DEADLINE,
  FALLBACK_SMART_TRANSACTIONS_MAX_FEE_MULTIPLIER,
  FALLBACK_SMART_TRANSACTIONS_REFRESH_TIME,
} from '../../../../shared/constants/smartTransactions';
import { MINUTE } from '../../../../shared/constants/time';

import type { SwapsControllerState } from './swaps.types';

export const controllerName = 'SwapsController';

// The MAX_GAS_LIMIT is a number that is higher than the maximum gas costs we have observed on any aggregator
export const MAX_GAS_LIMIT = 2500000;

// To ensure that our serves are not spammed if MetaMask is left idle, we limit the number of fetches for quotes that are made on timed intervals.
// 3 seems to be an appropriate balance of giving users the time they need when MetaMask is not left idle, and turning polling off when it is.
export const POLL_COUNT_LIMIT = 3;

// If for any reason the MetaSwap API fails to provide a refresh time,
// provide a reasonable fallback to avoid further errors
export const FALLBACK_QUOTE_REFRESH_TIME = MINUTE;

export function getDefaultSwapsControllerState(): SwapsControllerState {
  return {
    swapsState: {
      quotes: {},
      quotesPollingLimitEnabled: false,
      fetchParams: null,
      tokens: null,
      tradeTxId: null,
      approveTxId: null,
      quotesLastFetched: null,
      customMaxGas: '',
      customGasPrice: null,
      customMaxFeePerGas: null,
      customMaxPriorityFeePerGas: null,
      swapsUserFeeLevel: '',
      selectedAggId: null,
      customApproveTxData: '',
      errorKey: '',
      topAggId: null,
      routeState: '',
      swapsFeatureIsLive: true,
      saveFetchedQuotes: false,
      swapsQuoteRefreshTime: FALLBACK_QUOTE_REFRESH_TIME,
      swapsQuotePrefetchingRefreshTime: FALLBACK_QUOTE_REFRESH_TIME,
      swapsStxBatchStatusRefreshTime: FALLBACK_SMART_TRANSACTIONS_REFRESH_TIME,
      swapsStxStatusDeadline: FALLBACK_SMART_TRANSACTIONS_DEADLINE,
      swapsStxGetTransactionsRefreshTime:
        FALLBACK_SMART_TRANSACTIONS_REFRESH_TIME,
      swapsStxMaxFeeMultiplier: FALLBACK_SMART_TRANSACTIONS_MAX_FEE_MULTIPLIER,
      swapsFeatureFlags: {},
    },
  };
}
