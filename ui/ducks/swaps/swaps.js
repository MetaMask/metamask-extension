import { createSlice } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';
import log from 'loglevel';

import { captureMessage } from '@sentry/browser';

import { TransactionType } from '@metamask/transaction-controller';
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
  fetchSmartTransactionsLiveness,
  signAndSendSmartTransaction,
  updateSmartTransaction,
  setSmartTransactionsRefreshInterval,
  fetchSmartTransactionFees,
  cancelSmartTransaction,
  getTransactions,
} from '../../store/actions';
import {
  AWAITING_SIGNATURES_ROUTE,
  AWAITING_SWAP_ROUTE,
  BUILD_QUOTE_ROUTE,
  LOADING_QUOTES_ROUTE,
  SWAPS_ERROR_ROUTE,
  SWAPS_MAINTENANCE_ROUTE,
  SMART_TRANSACTION_STATUS_ROUTE,
} from '../../helpers/constants/routes';
import {
  fetchSwapsFeatureFlags,
  fetchSwapsGasPrices,
  isContractAddressValid,
  getSwapsLivenessForNetwork,
  parseSmartTransactionsError,
  StxErrorTypes,
} from '../../pages/swaps/swaps.util';
import {
  addHexes,
  decGWEIToHexWEI,
  decimalToHex,
  getValueFromWeiHex,
  hexWEIToDecGWEI,
} from '../../../shared/modules/conversion.utils';
import {
  getSelectedAccount,
  getTokenExchangeRates,
  getUSDConversionRate,
  getSwapsDefaultToken,
  getCurrentChainId,
  isHardwareWallet,
  getHardwareWalletType,
  checkNetworkAndAccountSupports1559,
  getSelectedNetworkClientId,
} from '../../selectors';

import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import {
  ERROR_FETCHING_QUOTES,
  QUOTES_NOT_AVAILABLE_ERROR,
  CONTRACT_DATA_DISABLED_ERROR,
  SWAP_FAILED_ERROR,
  SWAPS_FETCH_ORDER_CONFLICT,
  ALLOWED_SMART_TRANSACTIONS_CHAIN_IDS,
  Slippage,
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
import { Numeric } from '../../../shared/modules/Numeric';

export const GAS_PRICES_LOADING_STATES = {
  INITIAL: 'INITIAL',
  LOADING: 'LOADING',
  FAILED: 'FAILED',
  COMPLETED: 'COMPLETED',
};

export const FALLBACK_GAS_MULTIPLIER = 1.5;

const initialState = {
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
    setAggregatorMetadata: (state, action) => {
      state.aggregatorMetadata = action.payload;
    },
    setBalanceError: (state, action) => {
      state.balanceError = action.payload;
    },
    setFetchingQuotes: (state, action) => {
      state.fetchingQuotes = action.payload;
    },
    setLatestAddedTokenTo: (state, action) => {
      state.latestAddedTokenTo = action.payload;
    },
    setFromToken: (state, action) => {
      state.fromToken = action.payload;
    },
    setFromTokenInputValue: (state, action) => {
      state.fromTokenInputValue = action.payload;
    },
    setFromTokenError: (state, action) => {
      state.fromTokenError = action.payload;
    },
    setIsFeatureFlagLoaded: (state, action) => {
      state.isFeatureFlagLoaded = action.payload;
    },
    setMaxSlippage: (state, action) => {
      state.maxSlippage = action.payload;
    },
    setQuotesFetchStartTime: (state, action) => {
      state.quotesFetchStartTime = action.payload;
    },
    setReviewSwapClickedTimestamp: (state, action) => {
      state.reviewSwapClickedTimestamp = action.payload;
    },
    setTopAssets: (state, action) => {
      state.topAssets = action.payload;
    },
    setToToken: (state, action) => {
      state.toToken = action.payload;
    },
    swapCustomGasModalClosed: (state) => {
      state.customGas.price = null;
      state.customGas.limit = null;
    },
    swapCustomGasModalPriceEdited: (state, action) => {
      state.customGas.price = action.payload;
    },
    swapCustomGasModalLimitEdited: (state, action) => {
      state.customGas.limit = action.payload;
    },
    swapGasPriceEstimatesFetchStarted: (state) => {
      state.customGas.loading = GAS_PRICES_LOADING_STATES.LOADING;
    },
    swapGasPriceEstimatesFetchFailed: (state) => {
      state.customGas.loading = GAS_PRICES_LOADING_STATES.FAILED;
    },
    swapGasPriceEstimatesFetchCompleted: (state, action) => {
      state.customGas.priceEstimates = action.payload.priceEstimates;
      state.customGas.loading = GAS_PRICES_LOADING_STATES.COMPLETED;
    },
    retrievedFallbackSwapsGasPrice: (state, action) => {
      state.customGas.fallBackPrice = action.payload;
    },
    setCurrentSmartTransactionsError: (state, action) => {
      const isValidCurrentStxError =
        Object.values(StxErrorTypes).includes(action.payload) ||
        action.payload === undefined;
      const errorType = isValidCurrentStxError
        ? action.payload
        : StxErrorTypes.unavailable;
      state.currentSmartTransactionsError = errorType;
    },
    setSwapsSTXSubmitLoading: (state, action) => {
      state.swapsSTXLoading = action.payload || false;
    },
    setTransactionSettingsOpened: (state, action) => {
      state.transactionSettingsOpened = Boolean(action.payload);
    },
  },
});

const { actions, reducer } = slice;

export default reducer;

// Selectors

export const getAggregatorMetadata = (state) => state.swaps.aggregatorMetadata;

export const getBalanceError = (state) => state.swaps.balanceError;

export const getFromToken = (state) => state.swaps.fromToken;

export const getFromTokenError = (state) => state.swaps.fromTokenError;

export const getFromTokenInputValue = (state) =>
  state.swaps.fromTokenInputValue;

export const getIsFeatureFlagLoaded = (state) =>
  state.swaps.isFeatureFlagLoaded;

export const getSwapsSTXLoading = (state) => state.swaps.swapsSTXLoading;

export const getMaxSlippage = (state) => state.swaps.maxSlippage;

export const getTopAssets = (state) => state.swaps.topAssets;

export const getToToken = (state) => state.swaps.toToken;

export const getFetchingQuotes = (state) => state.swaps.fetchingQuotes;

export const getLatestAddedTokenTo = (state) => state.swaps.latestAddedTokenTo;

export const getQuotesFetchStartTime = (state) =>
  state.swaps.quotesFetchStartTime;

export const getReviewSwapClickedTimestamp = (state) =>
  state.swaps.reviewSwapClickedTimestamp;

export const getSwapsCustomizationModalPrice = (state) =>
  state.swaps.customGas.price;

export const getSwapsCustomizationModalLimit = (state) =>
  state.swaps.customGas.limit;

export const swapGasPriceEstimateIsLoading = (state) =>
  state.swaps.customGas.loading === GAS_PRICES_LOADING_STATES.LOADING;

export const swapGasEstimateLoadingHasFailed = (state) =>
  state.swaps.customGas.loading === GAS_PRICES_LOADING_STATES.INITIAL;

export const getSwapGasPriceEstimateData = (state) =>
  state.swaps.customGas.priceEstimates;

export const getSwapsFallbackGasPrice = (state) =>
  state.swaps.customGas.fallBackPrice;

export const getCurrentSmartTransactionsError = (state) =>
  state.swaps.currentSmartTransactionsError;

export const getTransactionSettingsOpened = (state) =>
  state.swaps.transactionSettingsOpened;

export function shouldShowCustomPriceTooLowWarning(state) {
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

const getSwapsState = (state) => state.metamask.swapsState;

export const getSwapsFeatureIsLive = (state) =>
  state.metamask.swapsState.swapsFeatureIsLive;

export const getSmartTransactionsError = (state) =>
  state.appState.smartTransactionsError;

export const getSmartTransactionsErrorMessageDismissed = (state) =>
  state.appState.smartTransactionsErrorMessageDismissed;

export const getSmartTransactionsEnabled = (state) => {
  const hardwareWalletUsed = isHardwareWallet(state);
  const chainId = getCurrentChainId(state);
  const isAllowedNetwork =
    ALLOWED_SMART_TRANSACTIONS_CHAIN_IDS.includes(chainId);
  const smartTransactionsFeatureFlagEnabled =
    state.metamask.swapsState?.swapsFeatureFlags?.smartTransactions
      ?.extensionActive;
  const smartTransactionsLiveness =
    state.metamask.smartTransactionsState?.liveness;
  return Boolean(
    isAllowedNetwork &&
      !hardwareWalletUsed &&
      smartTransactionsFeatureFlagEnabled &&
      smartTransactionsLiveness,
  );
};

export const getCurrentSmartTransactionsEnabled = (state) => {
  const smartTransactionsEnabled = getSmartTransactionsEnabled(state);
  const currentSmartTransactionsError = getCurrentSmartTransactionsError(state);
  return smartTransactionsEnabled && !currentSmartTransactionsError;
};

export const getSwapRedesignEnabled = (state) => {
  const swapRedesign =
    state.metamask.swapsState?.swapsFeatureFlags?.swapRedesign;
  if (swapRedesign === undefined) {
    return true; // By default show the redesign if we don't have feature flags returned yet.
  }
  return swapRedesign.extensionActive;
};

export const getSwapsQuoteRefreshTime = (state) =>
  state.metamask.swapsState.swapsQuoteRefreshTime;

export const getSwapsQuotePrefetchingRefreshTime = (state) =>
  state.metamask.swapsState.swapsQuotePrefetchingRefreshTime;

export const getBackgroundSwapRouteState = (state) =>
  state.metamask.swapsState.routeState;

export const getCustomSwapsGas = (state) =>
  state.metamask.swapsState.customMaxGas;

export const getCustomSwapsGasPrice = (state) =>
  state.metamask.swapsState.customGasPrice;

export const getCustomMaxFeePerGas = (state) =>
  state.metamask.swapsState.customMaxFeePerGas;

export const getCustomMaxPriorityFeePerGas = (state) =>
  state.metamask.swapsState.customMaxPriorityFeePerGas;

export const getSwapsUserFeeLevel = (state) =>
  state.metamask.swapsState.swapsUserFeeLevel;

export const getFetchParams = (state) => state.metamask.swapsState.fetchParams;

export const getQuotes = (state) => state.metamask.swapsState.quotes;

export const getQuotesLastFetched = (state) =>
  state.metamask.swapsState.quotesLastFetched;

export const getSelectedQuote = (state) => {
  const { selectedAggId, quotes } = getSwapsState(state);
  return quotes[selectedAggId];
};

export const getSwapsErrorKey = (state) => getSwapsState(state)?.errorKey;

export const getShowQuoteLoadingScreen = (state) =>
  state.swaps.showQuoteLoadingScreen;

export const getSwapsTokens = (state) => state.metamask.swapsState.tokens;

export const getSwapsWelcomeMessageSeenStatus = (state) =>
  state.metamask.swapsWelcomeMessageHasBeenShown;

export const getTopQuote = (state) => {
  const { topAggId, quotes } = getSwapsState(state);
  return quotes[topAggId];
};

export const getApproveTxId = (state) => state.metamask.swapsState.approveTxId;

export const getTradeTxId = (state) => state.metamask.swapsState.tradeTxId;

export const getUsedQuote = (state) =>
  getSelectedQuote(state) || getTopQuote(state);

// Compound selectors

export const getDestinationTokenInfo = (state) =>
  getFetchParams(state)?.metaData?.destinationTokenInfo;

export const getUsedSwapsGasPrice = (state) =>
  getCustomSwapsGasPrice(state) || getSwapsFallbackGasPrice(state);

export const getApproveTxParams = (state) => {
  const { approvalNeeded } =
    getSelectedQuote(state) || getTopQuote(state) || {};

  if (!approvalNeeded) {
    return null;
  }
  const data = getSwapsState(state)?.customApproveTxData || approvalNeeded.data;

  const gasPrice = getUsedSwapsGasPrice(state);
  return { ...approvalNeeded, gasPrice, data };
};

export const getSmartTransactionsOptInStatus = (state) => {
  return state.metamask.smartTransactionsState?.userOptInV2;
};

export const getCurrentSmartTransactions = (state) => {
  return state.metamask.smartTransactionsState?.smartTransactions?.[
    getCurrentChainId(state)
  ];
};

export const getPendingSmartTransactions = (state) => {
  const currentSmartTransactions = getCurrentSmartTransactions(state);
  if (!currentSmartTransactions || currentSmartTransactions.length === 0) {
    return [];
  }
  return currentSmartTransactions.filter(
    (stx) => stx.status === SmartTransactionStatus.pending,
  );
};

export const getSmartTransactionFees = (state) => {
  return state.metamask.smartTransactionsState?.fees;
};

export const getSmartTransactionEstimatedGas = (state) => {
  return state.metamask.smartTransactionsState?.estimatedGas;
};

export const getSwapsNetworkConfig = (state) => {
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
};

export const navigateBackToBuildQuote = (history) => {
  return async (dispatch) => {
    // TODO: Ensure any fetch in progress is cancelled
    await dispatch(setBackgroundSwapRouteState(''));
    dispatch(navigatedBackToBuildQuote());
    history.push(BUILD_QUOTE_ROUTE);
  };
};

export const prepareForRetryGetQuotes = () => {
  return async (dispatch) => {
    // TODO: Ensure any fetch in progress is cancelled
    await dispatch(resetSwapsPostFetchState());
    dispatch(retriedGetQuotes());
  };
};

export const prepareToLeaveSwaps = () => {
  return async (dispatch) => {
    dispatch(clearSwapsState());
    await dispatch(resetBackgroundSwapsState());
  };
};

export const swapsQuoteSelected = (aggId) => {
  return (dispatch) => {
    dispatch(swapCustomGasModalLimitEdited(null));
    dispatch(setSelectedQuoteAggId(aggId));
    dispatch(setSwapsTxGasLimit(''));
  };
};

export const fetchAndSetSwapsGasPriceInfo = () => {
  return async (dispatch) => {
    const basicEstimates = await dispatch(fetchMetaSwapsGasPriceEstimates());

    if (basicEstimates?.fast) {
      dispatch(setSwapsTxGasPrice(decGWEIToHexWEI(basicEstimates.fast)));
    }
  };
};

const disableStxIfRegularTxInProgress = (dispatch, transactions) => {
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
  return async (dispatch, getState) => {
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
        await dispatch(fetchSmartTransactionsLiveness());
        const transactions = await getTransactions({
          searchCriteria: {
            from: state.metamask?.selectedAddress,
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

const isTokenAlreadyAdded = (tokenAddress, tokens) => {
  if (!Array.isArray(tokens)) {
    return false;
  }
  return tokens.find(
    (token) => token.address.toLowerCase() === tokenAddress.toLowerCase(),
  );
};

export const fetchQuotesAndSetQuoteState = (
  history,
  inputValue,
  maxSlippage,
  trackEvent,
  pageRedirectionDisabled,
) => {
  return async (dispatch, getState) => {
    const state = getState();
    const chainId = getCurrentChainId(state);
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
      await history.push(SWAPS_MAINTENANCE_ROUTE);
      return;
    }

    const fetchParams = getFetchParams(state);
    const selectedAccount = getSelectedAccount(state);
    const networkClientId = getSelectedNetworkClientId(state);
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
      history.push(LOADING_QUOTES_ROUTE);
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
            networkClientId,
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
            networkClientId,
          },
          true,
        ),
      );
    }

    const swapsTokens = getSwapsTokens(state);

    const sourceTokenInfo =
      swapsTokens?.find(({ address }) => address === fromTokenAddress) ||
      selectedFromToken;
    const destinationTokenInfo =
      swapsTokens?.find(({ address }) => address === toTokenAddress) ||
      selectedToToken;

    dispatch(setFromToken(selectedFromToken));

    const hardwareWalletUsed = isHardwareWallet(state);
    const hardwareWalletType = getHardwareWalletType(state);
    const networkAndAccountSupports1559 =
      checkNetworkAndAccountSupports1559(state);
    const smartTransactionsOptInStatus = getSmartTransactionsOptInStatus(state);
    const smartTransactionsEnabled = getSmartTransactionsEnabled(state);
    const currentSmartTransactionsEnabled =
      getCurrentSmartTransactionsEnabled(state);
    trackEvent({
      event: 'Quotes Requested',
      category: MetaMetricsEventCategory.Swaps,
      sensitiveProperties: {
        token_from: fromTokenSymbol,
        token_from_amount: String(inputValue),
        token_to: toTokenSymbol,
        request_type: balanceError ? 'Quote' : 'Order',
        slippage: maxSlippage,
        custom_slippage: maxSlippage !== Slippage.default,
        is_hardware_wallet: hardwareWalletUsed,
        hardware_wallet_type: hardwareWalletType,
        stx_enabled: smartTransactionsEnabled,
        current_stx_enabled: currentSmartTransactionsEnabled,
        stx_user_opt_in: smartTransactionsOptInStatus,
        anonymizedData: true,
      },
    });

    try {
      const fetchStartTime = Date.now();
      dispatch(setQuotesFetchStartTime(fetchStartTime));

      const fetchAndSetQuotesPromise = dispatch(
        fetchAndSetQuotes(
          {
            slippage: maxSlippage,
            sourceToken: fromTokenAddress,
            destinationToken: toTokenAddress,
            value: inputValue,
            fromAddress: selectedAccount.address,
            balanceError,
            sourceDecimals: fromTokenDecimals,
          },
          {
            sourceTokenInfo,
            destinationTokenInfo,
            accountBalance: selectedAccount.balance,
            chainId,
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
        trackEvent({
          event: 'No Quotes Available',
          category: MetaMetricsEventCategory.Swaps,
          sensitiveProperties: {
            token_from: fromTokenSymbol,
            token_from_amount: String(inputValue),
            token_to: toTokenSymbol,
            request_type: balanceError ? 'Quote' : 'Order',
            slippage: maxSlippage,
            custom_slippage: maxSlippage !== Slippage.default,
            is_hardware_wallet: hardwareWalletUsed,
            hardware_wallet_type: hardwareWalletType,
            stx_enabled: smartTransactionsEnabled,
            current_stx_enabled: currentSmartTransactionsEnabled,
            stx_user_opt_in: smartTransactionsOptInStatus,
          },
        });
        dispatch(setSwapsErrorKey(QUOTES_NOT_AVAILABLE_ERROR));
      } else {
        const newSelectedQuote = fetchedQuotes[selectedAggId];

        const tokenToAmountBN = calcTokenAmount(
          newSelectedQuote.destinationAmount,
          newSelectedQuote.decimals || 18,
        );

        // Firefox and Chrome have different implementations of the APIs
        // that we rely on for communication accross the app. On Chrome big
        // numbers are converted into number strings, on firefox they remain
        // Big Number objects. As such, we convert them here for both
        // browsers.
        const tokenToAmountToString = tokenToAmountBN.toString(10);

        trackEvent({
          event: 'Quotes Received',
          category: MetaMetricsEventCategory.Swaps,
          sensitiveProperties: {
            token_from: fromTokenSymbol,
            token_from_amount: String(inputValue),
            token_to: toTokenSymbol,
            token_to_amount: tokenToAmountToString,
            request_type: balanceError ? 'Quote' : 'Order',
            slippage: maxSlippage,
            custom_slippage: maxSlippage !== Slippage.default,
            response_time: Date.now() - fetchStartTime,
            best_quote_source: newSelectedQuote.aggregator,
            available_quotes: Object.values(fetchedQuotes)?.length,
            is_hardware_wallet: hardwareWalletUsed,
            hardware_wallet_type: hardwareWalletType,
            stx_enabled: smartTransactionsEnabled,
            current_stx_enabled: currentSmartTransactionsEnabled,
            stx_user_opt_in: smartTransactionsOptInStatus,
            anonymizedData: true,
          },
        });

        dispatch(setInitialGasEstimate(selectedAggId));
      }
    } catch (e) {
      // A newer swap request is running, so simply bail and let the newer request respond
      if (e.message === SWAPS_FETCH_ORDER_CONFLICT) {
        log.debug(`Swap fetch order conflict detected; ignoring older request`);
        return;
      }
      // TODO: Check for any errors we should expect to occur in production, and report others to Sentry
      log.error(`Error fetching quotes: `, e);

      dispatch(setSwapsErrorKey(ERROR_FETCHING_QUOTES));
    }

    dispatch(setFetchingQuotes(false));
  };
};

export const signAndSendSwapsSmartTransaction = ({
  unsignedTransaction,
  trackEvent,
  history,
  additionalTrackingParams,
}) => {
  return async (dispatch, getState) => {
    dispatch(setSwapsSTXSubmitLoading(true));
    const state = getState();
    const fetchParams = getFetchParams(state);
    const { metaData, value: swapTokenValue, slippage } = fetchParams;
    const { sourceTokenInfo = {}, destinationTokenInfo = {} } = metaData;
    const usedQuote = getUsedQuote(state);
    const swapsNetworkConfig = getSwapsNetworkConfig(state);
    const chainId = getCurrentChainId(state);

    dispatch(
      setSmartTransactionsRefreshInterval(
        swapsNetworkConfig?.stxBatchStatusRefreshTime,
      ),
    );

    const usedTradeTxParams = usedQuote.trade;

    // update stx with data
    const destinationValue = calcTokenAmount(
      usedQuote.destinationAmount,
      destinationTokenInfo.decimals || 18,
    ).toPrecision(8);
    const smartTransactionsOptInStatus = getSmartTransactionsOptInStatus(state);
    const smartTransactionsEnabled = getSmartTransactionsEnabled(state);
    const currentSmartTransactionsEnabled =
      getCurrentSmartTransactionsEnabled(state);
    const swapMetaData = {
      token_from: sourceTokenInfo.symbol,
      token_from_amount: String(swapTokenValue),
      token_to: destinationTokenInfo.symbol,
      token_to_amount: destinationValue,
      slippage,
      custom_slippage: slippage !== 2,
      best_quote_source: getTopQuote(state)?.aggregator,
      available_quotes: getQuotes(state)?.length,
      other_quote_selected:
        usedQuote.aggregator !== getTopQuote(state)?.aggregator,
      other_quote_selected_source:
        usedQuote.aggregator === getTopQuote(state)?.aggregator
          ? ''
          : usedQuote.aggregator,
      average_savings: usedQuote.savings?.total,
      performance_savings: usedQuote.savings?.performance,
      fee_savings: usedQuote.savings?.fee,
      median_metamask_fee: usedQuote.savings?.medianMetaMaskFee,
      stx_enabled: smartTransactionsEnabled,
      current_stx_enabled: currentSmartTransactionsEnabled,
      stx_user_opt_in: smartTransactionsOptInStatus,
      ...additionalTrackingParams,
    };
    trackEvent({
      event: 'STX Swap Started',
      category: MetaMetricsEventCategory.Swaps,
      sensitiveProperties: swapMetaData,
    });

    if (!isContractAddressValid(usedTradeTxParams.to, chainId)) {
      captureMessage('Invalid contract address', {
        extra: {
          token_from: swapMetaData.token_from,
          token_to: swapMetaData.token_to,
          contract_address: usedTradeTxParams.to,
        },
      });
      await dispatch(setSwapsErrorKey(SWAP_FAILED_ERROR));
      history.push(SWAPS_ERROR_ROUTE);
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
      const fees = await dispatch(
        fetchSwapsSmartTransactionFees({
          unsignedTransaction,
          approveTxParams: updatedApproveTxParams,
          fallbackOnNotEnoughFunds: true,
        }),
      );
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
      history.push(SMART_TRANSACTION_STATUS_ROUTE);
      dispatch(setSwapsSTXSubmitLoading(false));
    } catch (e) {
      console.log('signAndSendSwapsSmartTransaction error', e);
      const {
        swaps: { isFeatureFlagLoaded },
      } = getState();
      if (e.message.startsWith('Fetch error:') && isFeatureFlagLoaded) {
        const errorObj = parseSmartTransactionsError(e.message);
        dispatch(setCurrentSmartTransactionsError(errorObj?.error));
      }
    }
  };
};

export const signAndSendTransactions = (
  history,
  trackEvent,
  additionalTrackingParams,
) => {
  return async (dispatch, getState) => {
    const state = getState();
    const chainId = getCurrentChainId(state);
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
      await history.push(SWAPS_MAINTENANCE_ROUTE);
      return;
    }

    const customSwapsGas = getCustomSwapsGas(state);
    const customMaxFeePerGas = getCustomMaxFeePerGas(state);
    const customMaxPriorityFeePerGas = getCustomMaxPriorityFeePerGas(state);
    const fetchParams = getFetchParams(state);
    const { metaData, value: swapTokenValue, slippage } = fetchParams;
    const { sourceTokenInfo = {}, destinationTokenInfo = {} } = metaData;
    await dispatch(setBackgroundSwapRouteState('awaiting'));
    await dispatch(stopPollingForQuotes());

    if (!hardwareWalletUsed) {
      history.push(AWAITING_SWAP_ROUTE);
    }

    const { fast: fastGasEstimate } = getSwapGasPriceEstimateData(state);

    let maxFeePerGas;
    let maxPriorityFeePerGas;
    let baseAndPriorityFeePerGas;
    let decEstimatedBaseFee;

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

    const usedQuote = getUsedQuote(state);
    const usedTradeTxParams = usedQuote.trade;

    const estimatedGasLimit = new BigNumber(
      usedQuote?.gasEstimate || `0x0`,
      16,
    );
    const estimatedGasLimitWithMultiplier = estimatedGasLimit
      .times(usedQuote?.gasMultiplier || FALLBACK_GAS_MULTIPLIER, 10)
      .round(0)
      .toString(16);
    const maxGasLimit =
      customSwapsGas ||
      (usedQuote?.gasEstimate
        ? estimatedGasLimitWithMultiplier
        : `0x${decimalToHex(usedQuote?.maxGas || 0)}`);

    const usedGasPrice = getUsedSwapsGasPrice(state);
    usedTradeTxParams.gas = maxGasLimit;
    if (networkAndAccountSupports1559) {
      usedTradeTxParams.maxFeePerGas = maxFeePerGas;
      usedTradeTxParams.maxPriorityFeePerGas = maxPriorityFeePerGas;
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
    const totalGasLimitEstimate = new BigNumber(usedGasLimitEstimate, 16)
      .plus(usedQuote.approvalNeeded?.gas || '0x0', 16)
      .toString(16);
    const gasEstimateTotalInUSD = getValueFromWeiHex({
      value: calcGasTotal(
        totalGasLimitEstimate,
        networkAndAccountSupports1559 ? baseAndPriorityFeePerGas : usedGasPrice,
      ),
      toCurrency: 'usd',
      conversionRate: usdConversionRate,
      numberOfDecimals: 6,
    });
    const smartTransactionsOptInStatus = getSmartTransactionsOptInStatus(state);
    const smartTransactionsEnabled = getSmartTransactionsEnabled(state);
    const currentSmartTransactionsEnabled =
      getCurrentSmartTransactionsEnabled(state);
    const swapMetaData = {
      token_from: sourceTokenInfo.symbol,
      token_from_amount: String(swapTokenValue),
      token_to: destinationTokenInfo.symbol,
      token_to_amount: destinationValue,
      slippage,
      custom_slippage: slippage !== 2,
      best_quote_source: getTopQuote(state)?.aggregator,
      available_quotes: getQuotes(state)?.length,
      other_quote_selected:
        usedQuote.aggregator !== getTopQuote(state)?.aggregator,
      other_quote_selected_source:
        usedQuote.aggregator === getTopQuote(state)?.aggregator
          ? ''
          : usedQuote.aggregator,
      gas_fees: gasEstimateTotalInUSD,
      estimated_gas: estimatedGasLimit.toString(10),
      suggested_gas_price: fastGasEstimate,
      used_gas_price: hexWEIToDecGWEI(usedGasPrice),
      average_savings: usedQuote.savings?.total,
      performance_savings: usedQuote.savings?.performance,
      fee_savings: usedQuote.savings?.fee,
      median_metamask_fee: usedQuote.savings?.medianMetaMaskFee,
      is_hardware_wallet: hardwareWalletUsed,
      hardware_wallet_type: getHardwareWalletType(state),
      stx_enabled: smartTransactionsEnabled,
      current_stx_enabled: currentSmartTransactionsEnabled,
      stx_user_opt_in: smartTransactionsOptInStatus,
      ...additionalTrackingParams,
    };
    if (networkAndAccountSupports1559) {
      swapMetaData.max_fee_per_gas = maxFeePerGas;
      swapMetaData.max_priority_fee_per_gas = maxPriorityFeePerGas;
      swapMetaData.base_and_priority_fee_per_gas = baseAndPriorityFeePerGas;
    }

    trackEvent({
      event: MetaMetricsEventName.SwapStarted,
      category: MetaMetricsEventCategory.Swaps,
      sensitiveProperties: swapMetaData,
    });

    if (!isContractAddressValid(usedTradeTxParams.to, chainId)) {
      captureMessage('Invalid contract address', {
        extra: {
          token_from: swapMetaData.token_from,
          token_to: swapMetaData.token_to,
          contract_address: usedTradeTxParams.to,
        },
      });
      await dispatch(setSwapsErrorKey(SWAP_FAILED_ERROR));
      history.push(SWAPS_ERROR_ROUTE);
      return;
    }

    let finalApproveTxMeta;
    const approveTxParams = getApproveTxParams(state);

    // For hardware wallets we go to the Awaiting Signatures page first and only after a user
    // completes 1 or 2 confirmations, we redirect to the Awaiting Swap page.
    if (hardwareWalletUsed) {
      history.push(AWAITING_SIGNATURES_ROUTE);
    }

    if (approveTxParams) {
      if (networkAndAccountSupports1559) {
        approveTxParams.maxFeePerGas = maxFeePerGas;
        approveTxParams.maxPriorityFeePerGas = maxPriorityFeePerGas;
        delete approveTxParams.gasPrice;
      }

      try {
        finalApproveTxMeta = await addTransactionAndWaitForPublish(
          { ...approveTxParams, amount: '0x0' },
          {
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
      } catch (e) {
        await dispatch(setSwapsErrorKey(SWAP_FAILED_ERROR));
        history.push(SWAPS_ERROR_ROUTE);
        return;
      }
    }

    try {
      await addTransactionAndWaitForPublish(usedTradeTxParams, {
        requireApproval: false,
        type: TransactionType.swap,
        swaps: {
          hasApproveTx: Boolean(approveTxParams),
          meta: {
            estimatedBaseFee: decEstimatedBaseFee,
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
      const errorKey = e.message.includes('EthAppPleaseEnableContractData')
        ? CONTRACT_DATA_DISABLED_ERROR
        : SWAP_FAILED_ERROR;
      console.error(e);
      await dispatch(setSwapsErrorKey(errorKey));
      history.push(SWAPS_ERROR_ROUTE);
      return;
    }

    // Only after a user confirms swapping on a hardware wallet (second `updateAndApproveTx` call above),
    // we redirect to the Awaiting Swap page.
    if (hardwareWalletUsed) {
      history.push(AWAITING_SWAP_ROUTE);
    }

    await forceUpdateMetamaskState(dispatch);
  };
};

export function fetchMetaSwapsGasPriceEstimates() {
  return async (dispatch, getState) => {
    const state = getState();
    const chainId = getCurrentChainId(state);

    dispatch(swapGasPriceEstimatesFetchStarted());

    let priceEstimates;
    try {
      priceEstimates = await fetchSwapsGasPrices(chainId);
    } catch (e) {
      log.warn('Fetching swaps gas prices failed:', e);

      if (!e.message?.match(/NetworkError|Fetch failed with status:/u)) {
        throw e;
      }

      dispatch(swapGasPriceEstimatesFetchFailed());

      try {
        const gasPrice = await global.ethQuery.gasPrice();
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
}) {
  return async (dispatch, getState) => {
    const {
      swaps: { isFeatureFlagLoaded },
    } = getState();
    try {
      return await dispatch(
        fetchSmartTransactionFees(unsignedTransaction, approveTxParams),
      );
    } catch (e) {
      if (e.message.startsWith('Fetch error:') && isFeatureFlagLoaded) {
        const errorObj = parseSmartTransactionsError(e.message);
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

export function cancelSwapsSmartTransaction(uuid) {
  return async (dispatch, getState) => {
    try {
      await dispatch(cancelSmartTransaction(uuid));
    } catch (e) {
      const {
        swaps: { isFeatureFlagLoaded },
      } = getState();
      if (e.message.startsWith('Fetch error:') && isFeatureFlagLoaded) {
        const errorObj = parseSmartTransactionsError(e.message);
        dispatch(setCurrentSmartTransactionsError(errorObj?.error));
      }
    }
  };
}
