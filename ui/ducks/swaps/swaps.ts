import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';
import log from 'loglevel';

import { TransactionType } from '@metamask/transaction-controller';
import { createProjectLogger } from '@metamask/utils';
import { captureMessage } from '../../../shared/lib/sentry';
import { CHAIN_IDS } from '../../../shared/constants/network';
import {
  addToken,
  addTransactionAndWaitForPublish,
  fetchAndSetQuotes,
  forceUpdateMetamaskState,
  resetSwapsPostFetchState,
  setBackgroundSwapRouteState,
  setInitialGasEstimate,
  setSwapsErrorKey,
  setSwapsTxGasPrice,
  stopPollingForQuotes,
  resetBackgroundSwapsState,
  setSwapsLiveness,
  setSwapsFeatureFlags,
  setSelectedQuoteAggId,
  setSwapsTxGasLimit,
  signAndSendSmartTransaction,
  updateSmartTransaction,
  setSmartTransactionsRefreshInterval,
  fetchSmartTransactionFees,
  cancelSmartTransaction,
  getTransactions,
} from '../../store/actions';
import {
  PREPARE_SWAP_ROUTE,
  CROSS_CHAIN_SWAP_ROUTE,
} from '../../helpers/constants/routes';
import {
  fetchSwapsFeatureFlags,
  fetchSwapsGasPrices,
  isContractAddressValid,
  getSwapsLivenessForNetwork,
  parseSmartTransactionsError,
  StxErrorTypes,
  getSwap1559GasFeeEstimates,
} from '../../pages/swaps/swaps.util';
import {
  addHexes,
  decGWEIToHexWEI,
  decimalToHex,
  getValueFromWeiHex,
  hexWEIToDecGWEI,
} from '../../../shared/lib/conversion.utils';
import {
  getCurrentChainId,
  getSelectedNetworkClientId,
} from '../../../shared/lib/selectors/networks';
import {
  getSelectedAccount,
  getTokenExchangeRates,
  getUSDConversionRate,
  getSwapsDefaultToken,
  checkNetworkAndAccountSupports1559,
  getSelectedNetwork,
  getHDEntropyIndex,
} from '../../selectors';
import { getSelectedInternalAccount } from '../../../shared/lib/selectors/accounts';
import {
  isHardwareWallet,
  getHardwareWalletType,
} from '../../../shared/lib/selectors/keyring';
import {
  getSmartTransactionsEnabled,
  getSmartTransactionsFeatureFlagsForChain,
  getSmartTransactionsOptInStatusForMetrics,
  getSmartTransactionsPreferenceEnabled,
} from '../../../shared/lib/selectors';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { createEventBuilder } from '../../../shared/lib/analytics/create-event-builder';
import {
  ERROR_FETCHING_QUOTES,
  QUOTES_NOT_AVAILABLE_ERROR,
  CONTRACT_DATA_DISABLED_ERROR,
  SWAP_FAILED_ERROR,
  SWAPS_FETCH_ORDER_CONFLICT,
  ALLOWED_SMART_TRANSACTIONS_CHAIN_IDS,
  Slippage,
  StablecoinsByChainId,
  SWAPS_QUOTE_MAX_RETURN_DIFFERENCE_PERCENTAGE,
} from '../../../shared/constants/swaps';
import {
  IN_PROGRESS_TRANSACTION_STATUSES,
  SmartTransactionStatus,
} from '../../../shared/constants/transaction';
import { getGasFeeEstimates, getTokens } from '../metamask/metamask';
import { ORIGIN_METAMASK } from '../../../shared/constants/app';
import {
  calcGasTotal,
  calcTokenAmount,
} from '../../../shared/lib/transactions-controller-utils';
import { EtherDenomination } from '../../../shared/constants/common';
import { Numeric } from '../../../shared/lib/Numeric';
import { calculateMaxGasLimit } from '../../../shared/lib/swaps-utils';
import { useTokenFiatAmount } from '../../hooks/useTokenFiatAmount';

const debugLog = createProjectLogger('swaps');

export const GAS_PRICES_LOADING_STATES = {
  INITIAL: 'INITIAL',
  LOADING: 'LOADING',
  FAILED: 'FAILED',
  COMPLETED: 'COMPLETED',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = Record<string, any>;

export type SwapsState = {
  aggregatorMetadata: Json | null;
  approveTxId: string | null;
  tradeTxId: string | null;
  balanceError: boolean | string;
  fetchingQuotes: boolean;
  fromToken: Json | null;
  fromTokenInputValue: string;
  fromTokenError: string | null;
  isFeatureFlagLoaded: boolean;
  maxSlippage: number;
  quotesFetchStartTime: number | null;
  reviewSwapClickedTimestamp: number | null;
  topAssets: Json;
  toToken: Json | null;
  customGas: {
    price: string | null;
    limit: string | null;
    loading: string;
    priceEstimates: Json;
    fallBackPrice: string | number | null;
  };
  currentSmartTransactionsError: string;
  swapsSTXLoading: boolean;
  transactionSettingsOpened: boolean;
  latestAddedTokenTo: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

type RootState = {
  swaps: SwapsState;
  metamask: Json;
  appState: Json;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Dispatch = (...args: any[]) => any;
type Navigate = (path: string) => void | Promise<void>;
type TrackEvent = (payload: Json) => void;

const initialState: SwapsState = {
  aggregatorMetadata: null,
  approveTxId: null,
  tradeTxId: null,
  balanceError: false,
  fetchingQuotes: false,
  fromToken: null,
  fromTokenInputValue: '',
  fromTokenError: null,
  isFeatureFlagLoaded: false,
  maxSlippage: Slippage.default,
  quotesFetchStartTime: null,
  reviewSwapClickedTimestamp: null,
  topAssets: {},
  toToken: null,
  customGas: {
    price: null,
    limit: null,
    loading: GAS_PRICES_LOADING_STATES.INITIAL,
    priceEstimates: {},
    fallBackPrice: null,
  },
  currentSmartTransactionsError: '',
  swapsSTXLoading: false,
  transactionSettingsOpened: false,
  latestAddedTokenTo: '',
};

const slice = createSlice({
  name: 'swaps',
  initialState,
  reducers: {
    clearSwapsState: () => initialState,
    navigatedBackToBuildQuote: (state) => {
      state.approveTxId = null;
      state.tradeTxId = null;
      state.balanceError = false;
      state.fetchingQuotes = false;
      state.customGas.limit = null;
      state.customGas.price = null;
    },
    retriedGetQuotes: (state) => {
      state.approveTxId = null;
      state.balanceError = false;
      state.fetchingQuotes = false;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setAggregatorMetadata: (state, action: PayloadAction<any>) => {
      state.aggregatorMetadata = action.payload;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setBalanceError: (state, action: PayloadAction<any>) => {
      state.balanceError = action.payload;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setFetchingQuotes: (state, action: PayloadAction<any>) => {
      state.fetchingQuotes = action.payload;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setLatestAddedTokenTo: (state, action: PayloadAction<any>) => {
      state.latestAddedTokenTo = action.payload;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setFromToken: (state, action: PayloadAction<any>) => {
      state.fromToken = action.payload;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setFromTokenInputValue: (state, action: PayloadAction<any>) => {
      state.fromTokenInputValue = action.payload;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setFromTokenError: (state, action: PayloadAction<any>) => {
      state.fromTokenError = action.payload;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setIsFeatureFlagLoaded: (state, action: PayloadAction<any>) => {
      state.isFeatureFlagLoaded = action.payload;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setMaxSlippage: (state, action: PayloadAction<any>) => {
      state.maxSlippage = action.payload;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setQuotesFetchStartTime: (state, action: PayloadAction<any>) => {
      state.quotesFetchStartTime = action.payload;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setReviewSwapClickedTimestamp: (state, action: PayloadAction<any>) => {
      state.reviewSwapClickedTimestamp = action.payload;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setTopAssets: (state, action: PayloadAction<any>) => {
      state.topAssets = action.payload;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setToToken: (state, action: PayloadAction<any>) => {
      state.toToken = action.payload;
    },
    swapCustomGasModalClosed: (state) => {
      state.customGas.price = null;
      state.customGas.limit = null;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    swapCustomGasModalPriceEdited: (state, action: PayloadAction<any>) => {
      state.customGas.price = action.payload;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    swapCustomGasModalLimitEdited: (state, action: PayloadAction<any>) => {
      state.customGas.limit = action.payload;
    },
    swapGasPriceEstimatesFetchStarted: (state) => {
      state.customGas.loading = GAS_PRICES_LOADING_STATES.LOADING;
    },
    swapGasPriceEstimatesFetchFailed: (state) => {
      state.customGas.loading = GAS_PRICES_LOADING_STATES.FAILED;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    swapGasPriceEstimatesFetchCompleted: (state, action: PayloadAction<any>) => {
      state.customGas.priceEstimates = action.payload.priceEstimates;
      state.customGas.loading = GAS_PRICES_LOADING_STATES.COMPLETED;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    retrievedFallbackSwapsGasPrice: (state, action: PayloadAction<any>) => {
      state.customGas.fallBackPrice = action.payload;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setCurrentSmartTransactionsError: (state, action: PayloadAction<any>) => {
      const isValidCurrentStxError =
        Object.values(StxErrorTypes).includes(action.payload) ||
        action.payload === undefined;
      const errorType = isValidCurrentStxError
        ? action.payload
        : StxErrorTypes.unavailable;
      state.currentSmartTransactionsError = errorType;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setSwapsSTXSubmitLoading: (state, action: PayloadAction<any>) => {
      state.swapsSTXLoading = action.payload || false;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setTransactionSettingsOpened: (state, action: PayloadAction<any>) => {
      state.transactionSettingsOpened = Boolean(action.payload);
    },
  },
});

const { actions, reducer } = slice;

export default reducer;

// Selectors

export const getAggregatorMetadata = (state: RootState) => state.swaps.aggregatorMetadata;

export const getBalanceError = (state: RootState) => state.swaps.balanceError;

export const getFromToken = (state: RootState) => state.swaps.fromToken;

export const getFromTokenError = (state: RootState) => state.swaps.fromTokenError;

export const getFromTokenInputValue = (state: RootState) =>
  state.swaps.fromTokenInputValue;

export const getIsFeatureFlagLoaded = (state: RootState) =>
  state.swaps.isFeatureFlagLoaded;

export const getSwapsSTXLoading = (state: RootState) => state.swaps.swapsSTXLoading;

export const getMaxSlippage = (state: RootState) => state.swaps.maxSlippage;

export const getTopAssets = (state: RootState) => state.swaps.topAssets;

export const getToToken = (state: RootState) => state.swaps.toToken;

export const getFetchingQuotes = (state: RootState) => state.swaps.fetchingQuotes;

export const getLatestAddedTokenTo = (state: RootState) => state.swaps.latestAddedTokenTo;

export const getQuotesFetchStartTime = (state: RootState) =>
  state.swaps.quotesFetchStartTime;

export const getReviewSwapClickedTimestamp = (state: RootState) =>
  state.swaps.reviewSwapClickedTimestamp;

export const getSwapsCustomizationModalPrice = (state: RootState) =>
  state.swaps.customGas.price;

export const getSwapsCustomizationModalLimit = (state: RootState) =>
  state.swaps.customGas.limit;

export const swapGasPriceEstimateIsLoading = (state: RootState) =>
  state.swaps.customGas.loading === GAS_PRICES_LOADING_STATES.LOADING;

export const swapGasEstimateLoadingHasFailed = (state: RootState) =>
  state.swaps.customGas.loading === GAS_PRICES_LOADING_STATES.INITIAL;

export const getSwapGasPriceEstimateData = (state: RootState) =>
  state.swaps.customGas.priceEstimates;

export const getSwapsFallbackGasPrice = (state: RootState) =>
  state.swaps.customGas.fallBackPrice;

export const getCurrentSmartTransactionsError = (state: RootState) =>
  state.swaps.currentSmartTransactionsError;

export const getTransactionSettingsOpened = (state: RootState) =>
  state.swaps.transactionSettingsOpened;

export function shouldShowCustomPriceTooLowWarning(state: RootState) {
  const { average } = getSwapGasPriceEstimateData(state);

  const customGasPrice = getSwapsCustomizationModalPrice(state);

  if (!customGasPrice || average === undefined) {
    return false;
  }

  const customPriceRisksSwapFailure = new Numeric(
    customGasPrice,
    16,
    EtherDenomination.WEI,
  )
    .toDenomination(EtherDenomination.GWEI)
    .greaterThan(average, 10);

  return customPriceRisksSwapFailure;
}

// Background selectors

const getSwapsState = (state: RootState) => state.metamask.swapsState;

export const getSwapsFeatureIsLive = (state: RootState) =>
  state.metamask.swapsState.swapsFeatureIsLive;

export const getSmartTransactionsError = (state: RootState) =>
  state.appState.smartTransactionsError;

export const getSmartTransactionsErrorMessageDismissed = (state: RootState) =>
  state.appState.smartTransactionsErrorMessageDismissed;

export const getCurrentSmartTransactionsEnabled = (state: RootState) => {
  const smartTransactionsEnabled = getSmartTransactionsEnabled(state);
  const currentSmartTransactionsError = getCurrentSmartTransactionsError(state);
  return smartTransactionsEnabled && !currentSmartTransactionsError;
};

export const getSwapsQuoteRefreshTime = (state: RootState) =>
  state.metamask.swapsState.swapsQuoteRefreshTime;

export const getSwapsQuotePrefetchingRefreshTime = (state: RootState) =>
  state.metamask.swapsState.swapsQuotePrefetchingRefreshTime;

export const getBackgroundSwapRouteState = (state: RootState) =>
  state.metamask.swapsState.routeState;

export const selectShowAwaitingSwapScreen = (state: RootState) =>
  state.metamask.swapsState.routeState === 'awaiting';

export const getCustomSwapsGas = (state: RootState) =>
  state.metamask.swapsState.customMaxGas;

export const getCustomSwapsGasPrice = (state: RootState) =>
  state.metamask.swapsState.customGasPrice;

export const getCustomMaxFeePerGas = (state: RootState) =>
  state.metamask.swapsState.customMaxFeePerGas;

export const getCustomMaxPriorityFeePerGas = (state: RootState) =>
  state.metamask.swapsState.customMaxPriorityFeePerGas;

export const getSwapsUserFeeLevel = (state: RootState) =>
  state.metamask.swapsState.swapsUserFeeLevel;

export const getFetchParams = (state: RootState) => state.metamask.swapsState.fetchParams;

export const getQuotes = (state: RootState) => state.metamask.swapsState.quotes;

export const selectHasSwapsQuotes = (state: RootState) =>
  Boolean(Object.values(state.metamask.swapsState.quotes || {}).length);

export const getQuotesLastFetched = (state: RootState) =>
  state.metamask.swapsState.quotesLastFetched;

export const getSelectedQuote = (state: RootState) => {
  const { selectedAggId, quotes } = getSwapsState(state);
  return quotes[selectedAggId];
};

export const getSwapsErrorKey = (state: RootState) => getSwapsState(state)?.errorKey;

export const getShowQuoteLoadingScreen = (state: RootState) =>
  state.swaps.showQuoteLoadingScreen;

export const getSwapsTokens = (state: RootState) => state.metamask.swapsState.tokens;

export const getSwapsWelcomeMessageSeenStatus = (state: RootState) =>
  state.metamask.swapsWelcomeMessageHasBeenShown;

export const getTopQuote = (state: RootState) => {
  const { topAggId, quotes } = getSwapsState(state);
  return quotes[topAggId];
};

export const getApproveTxId = (state: RootState) => state.metamask.swapsState.approveTxId;

export const getTradeTxId = (state: RootState) => state.metamask.swapsState.tradeTxId;

export const getUsedQuote = (state: RootState) =>
  getSelectedQuote(state) || getTopQuote(state);

// Compound selectors

export const getDestinationTokenInfo = (state: RootState) =>
  getFetchParams(state)?.metaData?.destinationTokenInfo;

export const getUsedSwapsGasPrice = (state: RootState) =>
  getCustomSwapsGasPrice(state) || getSwapsFallbackGasPrice(state);

export const getApproveTxParams = (state: RootState) => {
  const { approvalNeeded } =
    getSelectedQuote(state) || getTopQuote(state) || {};

  if (!approvalNeeded) {
    return null;
  }
  const data = getSwapsState(state)?.customApproveTxData || approvalNeeded.data;

  const gasPrice = getUsedSwapsGasPrice(state);
  return { ...approvalNeeded, gasPrice, data };
};

export const getCurrentSmartTransactions = (state: RootState) => {
  return state.metamask.smartTransactionsState?.smartTransactions?.[
    getCurrentChainId(state)
  ];
};

export const getPendingSmartTransactions = (state: RootState) => {
  const currentSmartTransactions = getCurrentSmartTransactions(state);
  if (!currentSmartTransactions || currentSmartTransactions.length === 0) {
    return [];
  }
  return currentSmartTransactions.filter(
    (stx) => stx.status === SmartTransactionStatus.pending,
  );
};

export const getSmartTransactionFees = (state: RootState) => {
  const usedQuote = getUsedQuote(state);
  if (!usedQuote?.isGasIncludedTrade) {
    return state.metamask.smartTransactionsState?.fees;
  }
  return {
    approvalTxFees: usedQuote.approvalTxFees,
    tradeTxFees: usedQuote.tradeTxFees,
  };
};

export const getSmartTransactionEstimatedGas = (state: RootState) => {
  return state.metamask.smartTransactionsState?.estimatedGas;
};

export const getSwapsNetworkConfig = (state: RootState) => {
  const {
    swapsQuoteRefreshTime,
    swapsQuotePrefetchingRefreshTime,
    swapsStxGetTransactionsRefreshTime,
    swapsStxBatchStatusRefreshTime,
    swapsStxStatusDeadline,
    swapsStxMaxFeeMultiplier,
  } = state.metamask.swapsState;
  return {
    quoteRefreshTime: swapsQuoteRefreshTime,
    quotePrefetchingRefreshTime: swapsQuotePrefetchingRefreshTime,
    stxGetTransactionsRefreshTime: swapsStxGetTransactionsRefreshTime,
    stxBatchStatusRefreshTime: swapsStxBatchStatusRefreshTime,
    stxStatusDeadline: swapsStxStatusDeadline,
    stxMaxFeeMultiplier: swapsStxMaxFeeMultiplier,
  };
};

// Actions / action-creators

const {
  clearSwapsState,
  navigatedBackToBuildQuote,
  retriedGetQuotes,
  swapGasPriceEstimatesFetchCompleted,
  swapGasPriceEstimatesFetchStarted,
  swapGasPriceEstimatesFetchFailed,
  setAggregatorMetadata,
  setBalanceError,
  setFetchingQuotes,
  setLatestAddedTokenTo,
  setFromToken,
  setFromTokenError,
  setFromTokenInputValue,
  setIsFeatureFlagLoaded,
  setMaxSlippage,
  setQuotesFetchStartTime,
  setReviewSwapClickedTimestamp,
  setTopAssets,
  setToToken,
  swapCustomGasModalPriceEdited,
  swapCustomGasModalLimitEdited,
  retrievedFallbackSwapsGasPrice,
  swapCustomGasModalClosed,
  setCurrentSmartTransactionsError,
  setSwapsSTXSubmitLoading,
  setTransactionSettingsOpened,
} = actions;

export {
  clearSwapsState,
  setAggregatorMetadata,
  setBalanceError,
  setFetchingQuotes,
  setLatestAddedTokenTo,
  setFromToken as setSwapsFromToken,
  setFromTokenError,
  setFromTokenInputValue,
  setIsFeatureFlagLoaded,
  setMaxSlippage,
  setQuotesFetchStartTime as setSwapQuotesFetchStartTime,
  setReviewSwapClickedTimestamp,
  setTopAssets,
  setToToken as setSwapToToken,
  swapCustomGasModalPriceEdited,
  swapCustomGasModalLimitEdited,
  swapCustomGasModalClosed,
  setTransactionSettingsOpened,
  slice as swapsSlice,
};

export const navigateBackToPrepareSwap = (navigate: Navigate) => {
  return async (dispatch: Dispatch) => {
    // TODO: Ensure any fetch in progress is cancelled
    await dispatch(setBackgroundSwapRouteState(''));
    dispatch(navigatedBackToBuildQuote());
    navigate(`${CROSS_CHAIN_SWAP_ROUTE}${PREPARE_SWAP_ROUTE}`);
  };
};

export const prepareForRetryGetQuotes = () => {
  return async (dispatch: Dispatch) => {
    // TODO: Ensure any fetch in progress is cancelled
    await dispatch(resetSwapsPostFetchState());
    dispatch(retriedGetQuotes());
  };
};

export const prepareToLeaveSwaps = () => {
  return async (dispatch: Dispatch) => {
    dispatch(clearSwapsState());
    await dispatch(resetBackgroundSwapsState());
  };
};

export const swapsQuoteSelected = (aggId: string) => {
  return (dispatch: Dispatch) => {
    dispatch(swapCustomGasModalLimitEdited(null));
    dispatch(setSelectedQuoteAggId(aggId));
    dispatch(setSwapsTxGasLimit(''));
  };
};

export const fetchAndSetSwapsGasPriceInfo = () => {
  return async (dispatch: Dispatch) => {
    const basicEstimates = await dispatch(fetchMetaSwapsGasPriceEstimates());

    if (basicEstimates?.fast) {
      dispatch(setSwapsTxGasPrice(decGWEIToHexWEI(basicEstimates.fast)));
    }
  };
};

const disableStxIfRegularTxInProgress = (
  dispatch: Dispatch,
  transactions?: Json[],
) => {
  if (transactions?.length <= 0) {
    return;
  }
  for (const transaction of transactions) {
    if (IN_PROGRESS_TRANSACTION_STATUSES.includes(transaction.status)) {
      dispatch(
        setCurrentSmartTransactionsError(StxErrorTypes.regularTxPending),
      );
      break;
    }
  }
};

export const fetchSwapsLivenessAndFeatureFlags = () => {
  return async (dispatch: Dispatch, getState: () => RootState) => {
    let swapsLivenessForNetwork = {
      swapsFeatureIsLive: false,
    };
    const state = getState();
    const chainId = getCurrentChainId(state);
    try {
      const swapsFeatureFlags = await fetchSwapsFeatureFlags();
      await dispatch(setSwapsFeatureFlags(swapsFeatureFlags));
      if (ALLOWED_SMART_TRANSACTIONS_CHAIN_IDS.includes(chainId)) {
        await dispatch(setCurrentSmartTransactionsError(undefined));
        const transactions = await getTransactions({
          searchCriteria: {
            chainId,
            from: getSelectedInternalAccount(state)?.address,
          },
        });
        disableStxIfRegularTxInProgress(dispatch, transactions);
      }
      swapsLivenessForNetwork = getSwapsLivenessForNetwork(
        chainId,
        swapsFeatureFlags,
      );
    } catch (error) {
      log.error(
        'Failed to fetch Swaps feature flags and Swaps liveness, defaulting to false.',
        error,
      );
    }
    await dispatch(setSwapsLiveness(swapsLivenessForNetwork));
    dispatch(setIsFeatureFlagLoaded(true));
    return swapsLivenessForNetwork;
  };
};

const isTokenAlreadyAdded = (tokenAddress: string, tokens?: Json[]) => {
  if (!Array.isArray(tokens)) {
    return false;
  }
  return tokens.find(
    (token) => token.address.toLowerCase() === tokenAddress.toLowerCase(),
  );
};

export const fetchQuotesAndSetQuoteState = (
  navigate: Navigate,
  inputValue: string | number,
  maxSlippage: number,
  trackEvent: TrackEvent,
  pageRedirectionDisabled?: boolean,
) => {
  return async (dispatch: Dispatch, getState: () => RootState) => {
    const state = getState();
    const hdEntropyIndex = getHDEntropyIndex(state);
    const selectedNetwork = getSelectedNetwork(state);
    const { chainId } = selectedNetwork.configuration;
    let swapsLivenessForNetwork = {
      swapsFeatureIsLive: false,
    };
    try {
      const swapsFeatureFlags = await fetchSwapsFeatureFlags();
      swapsLivenessForNetwork = getSwapsLivenessForNetwork(
        chainId,
        swapsFeatureFlags,
      );
    } catch (error) {
      log.error('Failed to fetch Swaps liveness, defaulting to false.', error);
    }
    await dispatch(setSwapsLiveness(swapsLivenessForNetwork));

    if (!swapsLivenessForNetwork.swapsFeatureIsLive) {
      await navigate(`${CROSS_CHAIN_SWAP_ROUTE}${PREPARE_SWAP_ROUTE}`);
      return;
    }

    const fetchParams = getFetchParams(state);
    const selectedAccount = getSelectedAccount(state);
    const balanceError = getBalanceError(state);
    const swapsDefaultToken = getSwapsDefaultToken(state);
    const fetchParamsFromToken =
      fetchParams?.metaData?.sourceTokenInfo?.symbol ===
      swapsDefaultToken.symbol
        ? swapsDefaultToken
        : fetchParams?.metaData?.sourceTokenInfo;
    const selectedFromToken = getFromToken(state) || fetchParamsFromToken || {};
    const selectedToToken =
      getToToken(state) || fetchParams?.metaData?.destinationTokenInfo || {};
    const {
      address: fromTokenAddress,
      symbol: fromTokenSymbol,
      decimals: fromTokenDecimals,
      iconUrl: fromTokenIconUrl,
      balance: fromTokenBalance,
    } = selectedFromToken;
    const {
      address: toTokenAddress,
      symbol: toTokenSymbol,
      decimals: toTokenDecimals,
      iconUrl: toTokenIconUrl,
    } = selectedToToken;
    // pageRedirectionDisabled is true if quotes prefetching is active (a user is on the Build Quote page).
    // In that case we just want to silently prefetch quotes without redirecting to the quotes loading page.
    if (!pageRedirectionDisabled) {
      await dispatch(setBackgroundSwapRouteState('loading'));
      navigate(`${CROSS_CHAIN_SWAP_ROUTE}${PREPARE_SWAP_ROUTE}`);
    }
    dispatch(setFetchingQuotes(true));

    const contractExchangeRates = getTokenExchangeRates(state);

    if (
      toTokenAddress &&
      toTokenSymbol !== swapsDefaultToken.symbol &&
      contractExchangeRates[toTokenAddress] === undefined &&
      !isTokenAlreadyAdded(toTokenAddress, getTokens(state))
    ) {
      await dispatch(
        addToken(
          {
            address: toTokenAddress,
            symbol: toTokenSymbol,
            decimals: toTokenDecimals,
            image: toTokenIconUrl,
            networkClientId: selectedNetwork.clientId,
          },
          true,
        ),
      );
      await dispatch(setLatestAddedTokenTo(toTokenAddress));
    } else {
      const latestAddedTokenTo = getLatestAddedTokenTo(state);
      // Only reset the latest added Token To if it's a different token.
      if (latestAddedTokenTo !== toTokenAddress) {
        await dispatch(setLatestAddedTokenTo(''));
      }
    }

    if (
      fromTokenAddress &&
      fromTokenSymbol !== swapsDefaultToken.symbol &&
      !contractExchangeRates[fromTokenAddress] &&
      fromTokenBalance &&
      new BigNumber(fromTokenBalance, 16).gt(0)
    ) {
      dispatch(
        addToken(
          {
            address: fromTokenAddress,
            symbol: fromTokenSymbol,
            decimals: fromTokenDecimals,
            image: fromTokenIconUrl,
            networkClientId: selectedNetwork.clientId,
          },
          true,
        ),
      );
    }

    const swapsTokens = getSwapsTokens(state);

    const sourceTokenInfo =
      swapsTokens?.find(({ address }: { address: string }) => address === fromTokenAddress) ||
      selectedFromToken;
    const destinationTokenInfo =
      swapsTokens?.find(({ address }: { address: string }) => address === toTokenAddress) ||
      selectedToToken;

    dispatch(setFromToken(selectedFromToken));

    const hardwareWalletUsed = isHardwareWallet(state);
    const hardwareWalletType = getHardwareWalletType(state);
    const networkAndAccountSupports1559 =
      checkNetworkAndAccountSupports1559(state);
    const smartTransactionsEnabled = getSmartTransactionsEnabled(state);
    const currentSmartTransactionsEnabled =
      getCurrentSmartTransactionsEnabled(state);

    // Helper function for case-insensitive address check in a Set
    const checkAddressInSetCaseInsensitive = (
      addressSet: Set<string>,
      addressToCheck?: string,
    ) => {
      if (!addressToCheck) {
        return false;
      }
      const lowerAddressToCheck = addressToCheck.toLowerCase();
      for (const addrInSet of addressSet) {
        if (addrInSet.toLowerCase() === lowerAddressToCheck) {
          return true;
        }
      }
      return false;
    };

    // Determines if the pair is an eligible stable token pair using case-insensitive check.
    // If the pair is a stablecoin pair in our list, we can use a lower slippage value of 0.5%.
    const stablecoinsForChain = StablecoinsByChainId[chainId];
    const isStableTokenPair = Boolean(
      stablecoinsForChain &&
      checkAddressInSetCaseInsensitive(stablecoinsForChain, fromTokenAddress) &&
      checkAddressInSetCaseInsensitive(stablecoinsForChain, toTokenAddress),
    );

    const slippageForFetch = isStableTokenPair ? Slippage.stable : maxSlippage;

    trackEvent(
      createEventBuilder(MetaMetricsEventName.QuotesRequested)
        .addCategory(MetaMetricsEventCategory.Swaps)
        .addSensitiveProperties({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_from: fromTokenSymbol,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_from_amount: String(inputValue),
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_to: toTokenSymbol,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          request_type: balanceError ? 'Quote' : 'Order',
          slippage: slippageForFetch,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          custom_slippage:
            slippageForFetch !== Slippage.default &&
            slippageForFetch !== Slippage.stable,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          is_hardware_wallet: hardwareWalletUsed,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          hardware_wallet_type: hardwareWalletType,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          stx_enabled: smartTransactionsEnabled,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          current_stx_enabled: currentSmartTransactionsEnabled,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          stx_user_opt_in: getSmartTransactionsOptInStatusForMetrics(state),
          anonymizedData: true,
        })
        .addProperties({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          hd_entropy_index: hdEntropyIndex,
        })
        .build(),
    );

    try {
      const fetchStartTime = Date.now();
      dispatch(setQuotesFetchStartTime(fetchStartTime));

      const fetchAndSetQuotesPromise = dispatch(
        fetchAndSetQuotes(
          {
            slippage: slippageForFetch,
            sourceToken: fromTokenAddress,
            destinationToken: toTokenAddress,
            value: inputValue,
            fromAddress: selectedAccount.address,
            balanceError,
            sourceDecimals: fromTokenDecimals,
            enableGasIncludedQuotes:
              currentSmartTransactionsEnabled &&
              getSmartTransactionsPreferenceEnabled(state),
          },
          {
            sourceTokenInfo,
            destinationTokenInfo,
            accountBalance: selectedAccount.balance,
            networkClientId: selectedNetwork.clientId,
          },
        ),
      );

      const gasPriceFetchPromise = networkAndAccountSupports1559
        ? null // For EIP 1559 we can get gas prices via "useGasFeeEstimates".
        : dispatch(fetchAndSetSwapsGasPriceInfo());

      const [[fetchedQuotes, selectedAggId]] = await Promise.all([
        fetchAndSetQuotesPromise,
        gasPriceFetchPromise,
      ]);

      if (Object.values(fetchedQuotes)?.length === 0) {
        trackEvent(
          createEventBuilder('No Quotes Available')
            .addCategory(MetaMetricsEventCategory.Swaps)
            .addSensitiveProperties({
              // eslint-disable-next-line @typescript-eslint/naming-convention
              token_from: fromTokenSymbol,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              token_from_amount: String(inputValue),
              // eslint-disable-next-line @typescript-eslint/naming-convention
              token_to: toTokenSymbol,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              request_type: balanceError ? 'Quote' : 'Order',
              slippage: slippageForFetch,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              custom_slippage:
                slippageForFetch !== Slippage.default &&
                slippageForFetch !== Slippage.stable,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              is_hardware_wallet: hardwareWalletUsed,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              hardware_wallet_type: hardwareWalletType,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              stx_enabled: smartTransactionsEnabled,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              current_stx_enabled: currentSmartTransactionsEnabled,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              stx_user_opt_in: getSmartTransactionsOptInStatusForMetrics(state),
            })
            .build(),
        );
        dispatch(setSwapsErrorKey(QUOTES_NOT_AVAILABLE_ERROR));
      } else {
        const newSelectedQuote = fetchedQuotes[selectedAggId];

        const tokenToAmountBN = calcTokenAmount(
          newSelectedQuote.destinationAmount,
          newSelectedQuote.decimals || 18,
        );

        // Firefox and Chrome have different implementations of the APIs
        // that we rely on for communication across the app. On Chrome big
        // numbers are converted into number strings, on firefox they remain
        // Big Number objects. As such, we convert them here for both
        // browsers.
        const tokenToAmountToString = tokenToAmountBN.toString(10);

        trackEvent(
          createEventBuilder(MetaMetricsEventName.QuotesReceived)
            .addCategory(MetaMetricsEventCategory.Swaps)
            .addSensitiveProperties({
              // eslint-disable-next-line @typescript-eslint/naming-convention
              token_from: fromTokenSymbol,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              token_from_amount: String(inputValue),
              // eslint-disable-next-line @typescript-eslint/naming-convention
              token_to: toTokenSymbol,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              token_to_amount: tokenToAmountToString,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              request_type: balanceError ? 'Quote' : 'Order',
              slippage: slippageForFetch,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              custom_slippage:
                slippageForFetch !== Slippage.default &&
                slippageForFetch !== Slippage.stable,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              response_time: Date.now() - fetchStartTime,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              best_quote_source: newSelectedQuote.aggregator,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              available_quotes: Object.values(fetchedQuotes)?.length,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              is_hardware_wallet: hardwareWalletUsed,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              hardware_wallet_type: hardwareWalletType,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              stx_enabled: smartTransactionsEnabled,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              current_stx_enabled: currentSmartTransactionsEnabled,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              stx_user_opt_in: getSmartTransactionsOptInStatusForMetrics(state),
              // eslint-disable-next-line @typescript-eslint/naming-convention
              gas_included: newSelectedQuote.isGasIncludedTrade,
              anonymizedData: true,
            })
            .addProperties({
              // eslint-disable-next-line @typescript-eslint/naming-convention
              hd_entropy_index: hdEntropyIndex,
            })
            .build(),
        );

        dispatch(setInitialGasEstimate(selectedAggId));
      }
    } catch (e) {
      const error = e as Error;
      // A newer swap request is running, so simply bail and let the newer request respond
      if (error.message === SWAPS_FETCH_ORDER_CONFLICT) {
        log.debug(`Swap fetch order conflict detected; ignoring older request`);
        return;
      }
      // TODO: Check for any errors we should expect to occur in production, and report others to Sentry
      log.error(`Error fetching quotes: `, error);

      dispatch(setSwapsErrorKey(ERROR_FETCHING_QUOTES));
    }

    dispatch(setFetchingQuotes(false));
  };
};

export const signAndSendSwapsSmartTransaction = ({
  unsignedTransaction,
  trackEvent,
  navigate,
  additionalTrackingParams,
}: {
  unsignedTransaction: Json;
  trackEvent: TrackEvent;
  navigate: Navigate;
  additionalTrackingParams?: Json;
}) => {
  return async (dispatch: Dispatch, getState: () => RootState) => {
    dispatch(setSwapsSTXSubmitLoading(true));
    const state = getState();
    const hdEntropyIndex = getHDEntropyIndex(state);
    const fetchParams = getFetchParams(state);
    const hardwareWalletUsed = isHardwareWallet(state);
    const hardwareWalletType = getHardwareWalletType(state);
    const { metaData, value: swapTokenValue, slippage } = fetchParams;
    const { sourceTokenInfo = {}, destinationTokenInfo = {} } = metaData;
    const usedQuote = getUsedQuote(state);
    const selectedNetwork = getSelectedNetwork(state);
    const chainId = getCurrentChainId(state);
    const featureFlags = getSmartTransactionsFeatureFlagsForChain(
      state,
      chainId,
    );

    dispatch(
      setSmartTransactionsRefreshInterval(
        featureFlags?.batchStatusPollingInterval,
      ),
    );

    const usedTradeTxParams = usedQuote.trade;

    // update stx with data
    const destinationValue = calcTokenAmount(
      usedQuote.destinationAmount,
      destinationTokenInfo.decimals || 18,
    ).toPrecision(8);
    const smartTransactionsEnabled = getSmartTransactionsEnabled(state);
    const currentSmartTransactionsEnabled =
      getCurrentSmartTransactionsEnabled(state);
    const swapMetaData = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      token_from: sourceTokenInfo.symbol,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      token_from_amount: String(swapTokenValue),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      token_to: destinationTokenInfo.symbol,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      token_to_amount: destinationValue,
      slippage,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      custom_slippage: slippage !== 2,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      best_quote_source: getTopQuote(state)?.aggregator,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      available_quotes: getQuotes(state)?.length,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      other_quote_selected:
        usedQuote.aggregator !== getTopQuote(state)?.aggregator,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      other_quote_selected_source:
        usedQuote.aggregator === getTopQuote(state)?.aggregator
          ? ''
          : usedQuote.aggregator,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      average_savings: usedQuote.savings?.total,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      performance_savings: usedQuote.savings?.performance,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      fee_savings: usedQuote.savings?.fee,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      median_metamask_fee: usedQuote.savings?.medianMetaMaskFee,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      is_hardware_wallet: hardwareWalletUsed,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      hardware_wallet_type: hardwareWalletType,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      stx_enabled: smartTransactionsEnabled,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      current_stx_enabled: currentSmartTransactionsEnabled,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      stx_user_opt_in: getSmartTransactionsOptInStatusForMetrics(state),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      gas_included: usedQuote.isGasIncludedTrade,
      ...additionalTrackingParams,
    };
    trackEvent(
      createEventBuilder('STX Swap Started')
        .addCategory(MetaMetricsEventCategory.Swaps)
        .addSensitiveProperties(swapMetaData)
        .addProperties({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          hd_entropy_index: hdEntropyIndex,
        })
        .build(),
    );

    if (
      !isContractAddressValid(
        usedTradeTxParams.to,
        selectedNetwork.configuration.chainId,
      )
    ) {
      captureMessage('Invalid contract address', {
        extra: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_from: swapMetaData.token_from,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_to: swapMetaData.token_to,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          contract_address: usedTradeTxParams.to,
        },
      });
      await dispatch(setSwapsErrorKey(SWAP_FAILED_ERROR));
      navigate(`${CROSS_CHAIN_SWAP_ROUTE}${PREPARE_SWAP_ROUTE}`);
      return;
    }

    const approveTxParams = getApproveTxParams(state);
    let approvalTxUuid;
    let updatedApproveTxParams;
    try {
      if (approveTxParams) {
        updatedApproveTxParams = {
          ...approveTxParams,
          value: '0x0',
        };
      }
      let fees;
      if (usedQuote.isGasIncludedTrade) {
        fees = getSmartTransactionFees(state);
      } else {
        fees = await dispatch(
          fetchSwapsSmartTransactionFees({
            unsignedTransaction,
            approveTxParams: updatedApproveTxParams,
            fallbackOnNotEnoughFunds: true,
          }),
        );
      }
      if (!fees) {
        log.error('"fetchSwapsSmartTransactionFees" failed');
        dispatch(setSwapsSTXSubmitLoading(false));
        dispatch(setCurrentSmartTransactionsError(StxErrorTypes.unavailable));
        return;
      }
      if (approveTxParams) {
        updatedApproveTxParams.gas = `0x${decimalToHex(
          fees.approvalTxFees?.gasLimit || 0,
        )}`;
        updatedApproveTxParams.chainId = selectedNetwork.configuration.chainId;
        approvalTxUuid = await dispatch(
          signAndSendSmartTransaction({
            unsignedTransaction: updatedApproveTxParams,
            smartTransactionFees: fees.approvalTxFees,
          }),
        );
      }
      unsignedTransaction.gas = `0x${decimalToHex(
        fees.tradeTxFees?.gasLimit || 0,
      )}`;
      unsignedTransaction.chainId = selectedNetwork.configuration.chainId;
      const uuid = await dispatch(
        signAndSendSmartTransaction({
          unsignedTransaction,
          smartTransactionFees: fees.tradeTxFees,
        }),
      );

      const destinationTokenAddress = destinationTokenInfo.address;
      const destinationTokenDecimals = destinationTokenInfo.decimals;
      const destinationTokenSymbol = destinationTokenInfo.symbol;
      const sourceTokenSymbol = sourceTokenInfo.symbol;
      await dispatch(
        updateSmartTransaction(uuid, {
          origin: ORIGIN_METAMASK,
          destinationTokenAddress,
          destinationTokenDecimals,
          destinationTokenSymbol,
          sourceTokenSymbol,
          swapMetaData,
          swapTokenValue,
          type: TransactionType.swap,
        }),
      );
      if (approvalTxUuid) {
        await dispatch(
          updateSmartTransaction(approvalTxUuid, {
            origin: ORIGIN_METAMASK,
            type: TransactionType.swapApproval,
            sourceTokenSymbol,
          }),
        );
      }
      navigate(`${CROSS_CHAIN_SWAP_ROUTE}${PREPARE_SWAP_ROUTE}`);
      dispatch(setSwapsSTXSubmitLoading(false));
    } catch (e) {
      const error = e as Error;
      console.log('signAndSendSwapsSmartTransaction error', error);
      dispatch(setSwapsSTXSubmitLoading(false));
      const {
        swaps: { isFeatureFlagLoaded },
      } = getState();
      if (error.message.startsWith('Fetch error:') && isFeatureFlagLoaded) {
        const errorObj = parseSmartTransactionsError(error.message);
        dispatch(setCurrentSmartTransactionsError(errorObj?.error));
      }
    }
  };
};

export const signAndSendTransactions = (
  navigate: Navigate,
  trackEvent: TrackEvent,
  additionalTrackingParams?: Json,
) => {
  return async (dispatch: Dispatch, getState: () => RootState) => {
    const state = getState();
    const hdEntropyIndex = getHDEntropyIndex(state);
    const chainId = getCurrentChainId(state);
    const globalNetworkClientId = getSelectedNetworkClientId(state);
    const hardwareWalletUsed = isHardwareWallet(state);
    const networkAndAccountSupports1559 =
      checkNetworkAndAccountSupports1559(state);
    let swapsLivenessForNetwork = {
      swapsFeatureIsLive: false,
    };
    try {
      const swapsFeatureFlags = await fetchSwapsFeatureFlags();
      swapsLivenessForNetwork = getSwapsLivenessForNetwork(
        chainId,
        swapsFeatureFlags,
      );
    } catch (error) {
      log.error('Failed to fetch Swaps liveness, defaulting to false.', error);
    }
    await dispatch(setSwapsLiveness(swapsLivenessForNetwork));

    if (!swapsLivenessForNetwork.swapsFeatureIsLive) {
      await navigate(`${CROSS_CHAIN_SWAP_ROUTE}${PREPARE_SWAP_ROUTE}`);
      return;
    }

    const customSwapsGas = getCustomSwapsGas(state);
    const fetchParams = getFetchParams(state);
    const { metaData, value: swapTokenValue, slippage } = fetchParams;
    const { sourceTokenInfo = {}, destinationTokenInfo = {} } = metaData;
    await dispatch(setBackgroundSwapRouteState('awaiting'));
    await dispatch(stopPollingForQuotes());

    if (!hardwareWalletUsed) {
      navigate(`${CROSS_CHAIN_SWAP_ROUTE}${PREPARE_SWAP_ROUTE}`);
    }

    const { fast: fastGasEstimate } = getSwapGasPriceEstimateData(state);

    const usedQuote = getUsedQuote(state);
    const usedTradeTxParams = usedQuote.trade;
    const approveTxParams = getApproveTxParams(state);

    let transactionGasFeeEstimates;

    if (networkAndAccountSupports1559) {
      const networkGasFeeEstimates = getGasFeeEstimates(state);
      const { estimatedBaseFee = '0' } = networkGasFeeEstimates;

      transactionGasFeeEstimates = await getSwap1559GasFeeEstimates(
        usedQuote.trade,
        approveTxParams,
        estimatedBaseFee,
        chainId,
      );

      debugLog('Received 1559 gas fee estimates', transactionGasFeeEstimates);
    }

    const tradeGasFeeEstimates =
      transactionGasFeeEstimates?.tradeGasFeeEstimates;

    const approveGasFeeEstimates =
      transactionGasFeeEstimates?.approveGasFeeEstimates;

    const estimatedGasLimit = new BigNumber(usedQuote?.gasEstimate || 0, 16)
      .round(0)
      .toString(16);

    const maxGasLimit = calculateMaxGasLimit(
      usedQuote?.gasEstimate,
      usedQuote?.gasMultiplier,
      usedQuote?.maxGas,
      customSwapsGas,
    );

    const usedGasPrice = getUsedSwapsGasPrice(state);
    usedTradeTxParams.gas = maxGasLimit;

    if (networkAndAccountSupports1559) {
      usedTradeTxParams.maxFeePerGas = tradeGasFeeEstimates?.maxFeePerGas;
      usedTradeTxParams.maxPriorityFeePerGas =
        tradeGasFeeEstimates?.maxPriorityFeePerGas;
      delete usedTradeTxParams.gasPrice;
    } else {
      usedTradeTxParams.gasPrice = usedGasPrice;
    }

    const usdConversionRate = getUSDConversionRate(state);

    const destinationValue = calcTokenAmount(
      usedQuote.destinationAmount,
      destinationTokenInfo.decimals || 18,
    ).toPrecision(8);

    const usedGasLimitEstimate =
      usedQuote?.gasEstimateWithRefund ||
      `0x${decimalToHex(usedQuote?.averageGas || 0)}`;

    const tradeTotalGasEstimate = calcGasTotal(
      usedGasLimitEstimate,
      networkAndAccountSupports1559
        ? tradeGasFeeEstimates?.baseAndPriorityFeePerGas
        : usedGasPrice,
    );

    const approvalGasLimitEstimate = usedQuote.approvalNeeded?.gas;

    const approvalTotalGasEstimate = approvalGasLimitEstimate
      ? calcGasTotal(
          approvalGasLimitEstimate,
          networkAndAccountSupports1559
            ? approveGasFeeEstimates?.baseAndPriorityFeePerGas
            : usedGasPrice,
        )
      : '0x0';

    const gasEstimateTotalInUSD = getValueFromWeiHex({
      value: addHexes(tradeTotalGasEstimate, approvalTotalGasEstimate),
      toCurrency: 'usd',
      conversionRate: usdConversionRate,
      numberOfDecimals: 6,
    });

    const smartTransactionsEnabled = getSmartTransactionsEnabled(state);
    const currentSmartTransactionsEnabled =
      getCurrentSmartTransactionsEnabled(state);

    const swapMetaData = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      token_from: sourceTokenInfo.symbol,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      token_from_amount: String(swapTokenValue),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      token_to: destinationTokenInfo.symbol,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      token_to_amount: destinationValue,
      slippage,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      custom_slippage: slippage !== 2,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      best_quote_source: getTopQuote(state)?.aggregator,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      available_quotes: getQuotes(state)?.length,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      other_quote_selected:
        usedQuote.aggregator !== getTopQuote(state)?.aggregator,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      other_quote_selected_source:
        usedQuote.aggregator === getTopQuote(state)?.aggregator
          ? ''
          : usedQuote.aggregator,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      gas_fees: gasEstimateTotalInUSD,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      estimated_gas: new BigNumber(estimatedGasLimit, 16).toString(10),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      suggested_gas_price: fastGasEstimate,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      used_gas_price: hexWEIToDecGWEI(usedGasPrice),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      average_savings: usedQuote.savings?.total,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      performance_savings: usedQuote.savings?.performance,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      fee_savings: usedQuote.savings?.fee,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      median_metamask_fee: usedQuote.savings?.medianMetaMaskFee,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      is_hardware_wallet: hardwareWalletUsed,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      hardware_wallet_type: getHardwareWalletType(state),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      stx_enabled: smartTransactionsEnabled,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      current_stx_enabled: currentSmartTransactionsEnabled,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      stx_user_opt_in: getSmartTransactionsOptInStatusForMetrics(state),
      ...additionalTrackingParams,
    };

    if (networkAndAccountSupports1559) {
      swapMetaData.max_fee_per_gas = tradeGasFeeEstimates?.maxFeePerGas;
      swapMetaData.max_priority_fee_per_gas =
        tradeGasFeeEstimates?.maxPriorityFeePerGas;
      swapMetaData.base_and_priority_fee_per_gas =
        tradeGasFeeEstimates?.baseAndPriorityFeePerGas;
    }

    trackEvent(
      createEventBuilder(MetaMetricsEventName.SwapStarted)
        .addCategory(MetaMetricsEventCategory.Swaps)
        .addSensitiveProperties(swapMetaData)
        .addProperties({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          hd_entropy_index: hdEntropyIndex,
        })
        .build(),
    );

    if (!isContractAddressValid(usedTradeTxParams.to, chainId)) {
      captureMessage('Invalid contract address', {
        extra: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_from: swapMetaData.token_from,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_to: swapMetaData.token_to,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          contract_address: usedTradeTxParams.to,
        },
      });
      await dispatch(setSwapsErrorKey(SWAP_FAILED_ERROR));
      navigate(`${CROSS_CHAIN_SWAP_ROUTE}${PREPARE_SWAP_ROUTE}`);
      return;
    }

    let finalApproveTxMeta;

    // For hardware wallets we keep users on the unified cross-chain prepare page
    // while confirmations are in progress.
    if (hardwareWalletUsed) {
      navigate(`${CROSS_CHAIN_SWAP_ROUTE}${PREPARE_SWAP_ROUTE}`);
    }

    if (approveTxParams) {
      if (networkAndAccountSupports1559) {
        approveTxParams.maxFeePerGas = approveGasFeeEstimates?.maxFeePerGas;
        approveTxParams.maxPriorityFeePerGas =
          approveGasFeeEstimates?.maxPriorityFeePerGas;
        delete approveTxParams.gasPrice;
      }

      debugLog('Creating approve transaction', approveTxParams);

      try {
        finalApproveTxMeta = await addTransactionAndWaitForPublish(
          { ...approveTxParams, amount: '0x0' },
          {
            networkClientId: globalNetworkClientId,
            requireApproval: false,
            type: TransactionType.swapApproval,
            swaps: {
              hasApproveTx: true,
              meta: {
                type: TransactionType.swapApproval,
                sourceTokenSymbol: sourceTokenInfo.symbol,
              },
            },
          },
        );
        if (
          [
            CHAIN_IDS.LINEA_MAINNET,
            CHAIN_IDS.LINEA_GOERLI,
            CHAIN_IDS.LINEA_SEPOLIA,
          ].includes(chainId)
        ) {
          debugLog(
            'Delaying submitting trade tx to make Linea confirmation more likely',
          );
          const waitPromise = new Promise((resolve) =>
            setTimeout(resolve, 5000),
          );
          await waitPromise;
        }
      } catch (e) {
        debugLog('Approve transaction failed', e as Error);
        await dispatch(setSwapsErrorKey(SWAP_FAILED_ERROR));
        navigate(`${CROSS_CHAIN_SWAP_ROUTE}${PREPARE_SWAP_ROUTE}`);
        return;
      }
    }

    debugLog('Creating trade transaction', usedTradeTxParams);

    try {
      await addTransactionAndWaitForPublish(usedTradeTxParams, {
        networkClientId: globalNetworkClientId,
        requireApproval: false,
        type: TransactionType.swap,
        swaps: {
          hasApproveTx: Boolean(approveTxParams),
          meta: {
            estimatedBaseFee: transactionGasFeeEstimates?.estimatedBaseFee,
            sourceTokenSymbol: sourceTokenInfo.symbol,
            destinationTokenSymbol: destinationTokenInfo.symbol,
            type: TransactionType.swap,
            destinationTokenDecimals: destinationTokenInfo.decimals,
            destinationTokenAddress: destinationTokenInfo.address,
            swapMetaData,
            swapTokenValue,
            approvalTxId: finalApproveTxMeta?.id,
          },
        },
      });
    } catch (e) {
      const error = e as Error;
      const errorKey = error.message.includes('EthAppPleaseEnableContractData')
        ? CONTRACT_DATA_DISABLED_ERROR
        : SWAP_FAILED_ERROR;
      debugLog('Trade transaction failed', error);
      await dispatch(setSwapsErrorKey(errorKey));
      navigate(`${CROSS_CHAIN_SWAP_ROUTE}${PREPARE_SWAP_ROUTE}`);
      return;
    }

    // Only after a user confirms swapping on a hardware wallet (second `updateAndApproveTx` call above),
    // we redirect back to the unified cross-chain prepare page.
    if (hardwareWalletUsed) {
      navigate(`${CROSS_CHAIN_SWAP_ROUTE}${PREPARE_SWAP_ROUTE}`);
    }

    await forceUpdateMetamaskState(dispatch);
  };
};

export function fetchMetaSwapsGasPriceEstimates() {
  return async (dispatch: Dispatch, getState: () => RootState) => {
    const state = getState();
    const chainId = getCurrentChainId(state);

    dispatch(swapGasPriceEstimatesFetchStarted());

    let priceEstimates;
    try {
      priceEstimates = await fetchSwapsGasPrices(chainId);
    } catch (e) {
      const error = e as Error;
      log.warn('Fetching swaps gas prices failed:', error);

      // TODO: This works, but we should figure out why we are getting a JSON parse error
      if (
        !error.message?.match(
          /NetworkError|Fetch failed with status:|Unexpected end of JSON input/u,
        )
      ) {
        throw error;
      }

      dispatch(swapGasPriceEstimatesFetchFailed());

      try {
        const gasPrice = await global.ethereumProvider.request({
          method: 'eth_gasPrice',
          params: [],
        });
        const gasPriceInDecGWEI = hexWEIToDecGWEI(gasPrice.toString(10));

        dispatch(retrievedFallbackSwapsGasPrice(gasPriceInDecGWEI));
        return null;
      } catch (networkGasPriceError) {
        console.error(
          `Failed to retrieve fallback gas price: `,
          networkGasPriceError,
        );
        return null;
      }
    }

    dispatch(
      swapGasPriceEstimatesFetchCompleted({
        priceEstimates,
      }),
    );
    return priceEstimates;
  };
}

export function fetchSwapsSmartTransactionFees({
  unsignedTransaction,
  approveTxParams,
  fallbackOnNotEnoughFunds = false,
}: {
  unsignedTransaction: Json;
  approveTxParams?: Json;
  fallbackOnNotEnoughFunds?: boolean;
}) {
  return async (dispatch: Dispatch, getState: () => RootState) => {
    const {
      swaps: { isFeatureFlagLoaded },
    } = getState();
    try {
      return await dispatch(
        fetchSmartTransactionFees(unsignedTransaction, approveTxParams),
      );
    } catch (e) {
      const error = e as Error;
      if (error.message.startsWith('Fetch error:') && isFeatureFlagLoaded) {
        const errorObj = parseSmartTransactionsError(error.message);
        if (
          fallbackOnNotEnoughFunds ||
          errorObj?.error !== StxErrorTypes.notEnoughFunds
        ) {
          dispatch(setCurrentSmartTransactionsError(errorObj?.error));
        }
      }
    }
    return null;
  };
}

export function cancelSwapsSmartTransaction(uuid: string) {
  return async (dispatch: Dispatch, getState: () => RootState) => {
    try {
      await dispatch(cancelSmartTransaction(uuid));
    } catch (e) {
      const error = e as Error;
      const {
        swaps: { isFeatureFlagLoaded },
      } = getState();
      if (error.message.startsWith('Fetch error:') && isFeatureFlagLoaded) {
        const errorObj = parseSmartTransactionsError(error.message);
        dispatch(setCurrentSmartTransactionsError(errorObj?.error));
      }
    }
  };
}

export const useGetIsEstimatedReturnLow = ({
  usedQuote,
  rawNetworkFees,
}: {
  usedQuote: Json;
  rawNetworkFees: string | number | null;
}) => {
  const sourceTokenAmount = calcTokenAmount(
    usedQuote?.sourceAmount,
    usedQuote?.sourceTokenInfo?.decimals,
  );
  const sourceTokenFiatAmount = useTokenFiatAmount(
    usedQuote?.sourceTokenInfo?.address,
    sourceTokenAmount || 0,
    usedQuote?.sourceTokenInfo?.symbol,
    {
      showFiat: true,
    },
    true,
    null,
    false,
  );
  const destinationTokenAmount = calcTokenAmount(
    usedQuote?.destinationAmount,
    usedQuote?.destinationTokenInfo?.decimals,
  );
  // Disabled because it's not a hook
  const destinationTokenFiatAmount = useTokenFiatAmount(
    usedQuote?.destinationTokenInfo?.address,
    destinationTokenAmount || 0,
    usedQuote?.destinationTokenInfo?.symbol,
    {
      showFiat: true,
    },
    true,
    null,
    false,
  );
  const adjustedReturnValue =
    destinationTokenFiatAmount && rawNetworkFees
      ? new BigNumber(destinationTokenFiatAmount).minus(
          new BigNumber(rawNetworkFees),
        )
      : null;
  const isEstimatedReturnLow =
    sourceTokenFiatAmount && adjustedReturnValue
      ? adjustedReturnValue.lt(
          new BigNumber(sourceTokenFiatAmount).times(
            1 - SWAPS_QUOTE_MAX_RETURN_DIFFERENCE_PERCENTAGE,
          ),
        )
      : false;
  return isEstimatedReturnLow;
};
