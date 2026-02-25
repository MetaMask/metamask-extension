import { createSlice } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';
import log from 'loglevel';

import {
  setBackgroundSwapRouteState,
  setSwapsTxGasPrice,
  setSwapsLiveness,
  setSwapsFeatureFlags,
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
  getSwapsLivenessForNetwork,
  parseSmartTransactionsError,
  StxErrorTypes,
} from '../../pages/swaps/swaps.util';
import {
  decGWEIToHexWEI,
  hexWEIToDecGWEI,
} from '../../../shared/modules/conversion.utils';
import { getCurrentChainId } from '../../../shared/modules/selectors/networks';
import { getSelectedInternalAccount } from '../../selectors';
import { getSmartTransactionsEnabled } from '../../../shared/modules/selectors';
import {
  ALLOWED_SMART_TRANSACTIONS_CHAIN_IDS,
  Slippage,
  SWAPS_QUOTE_MAX_RETURN_DIFFERENCE_PERCENTAGE,
} from '../../../shared/constants/swaps';
import { IN_PROGRESS_TRANSACTION_STATUSES } from '../../../shared/constants/transaction';
import { calcTokenAmount } from '../../../shared/lib/transactions-controller-utils';
import { useTokenFiatAmount } from '../../hooks/useTokenFiatAmount';

export const GAS_PRICES_LOADING_STATES = {
  INITIAL: 'INITIAL',
  LOADING: 'LOADING',
  FAILED: 'FAILED',
  COMPLETED: 'COMPLETED',
};

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
    setTransactionSettingsOpened: (state, action) => {
      state.transactionSettingsOpened = Boolean(action.payload);
    },
  },
});

const { actions, reducer } = slice;

export default reducer;

export const getBalanceError = (state) => state.swaps.balanceError;

export const getFromToken = (state) => state.swaps.fromToken;

export const getToToken = (state) => state.swaps.toToken;

export const getLatestAddedTokenTo = (state) => state.swaps.latestAddedTokenTo;

export const getSwapsCustomizationModalPrice = (state) =>
  state.swaps.customGas.price;

export const getSwapGasPriceEstimateData = (state) =>
  state.swaps.customGas.priceEstimates;

export const getSwapsFallbackGasPrice = (state) =>
  state.swaps.customGas.fallBackPrice;

export const getCurrentSmartTransactionsError = (state) =>
  state.swaps.currentSmartTransactionsError;

// Background selectors

const getSwapsState = (state) => state.metamask.swapsState;

export const getSwapsFeatureIsLive = (state) =>
  state.metamask.swapsState.swapsFeatureIsLive;

export const getCurrentSmartTransactionsEnabled = (state) => {
  const smartTransactionsEnabled = getSmartTransactionsEnabled(state);
  const currentSmartTransactionsError = getCurrentSmartTransactionsError(state);
  return smartTransactionsEnabled && !currentSmartTransactionsError;
};

export const selectShowAwaitingSwapScreen = (state) =>
  state.metamask.swapsState.routeState === 'awaiting';

export const getCustomSwapsGas = (state) =>
  state.metamask.swapsState.customMaxGas;

export const getCustomSwapsGasPrice = (state) =>
  state.metamask.swapsState.customGasPrice;

export const getFetchParams = (state) => state.metamask.swapsState.fetchParams;

export const getQuotes = (state) => state.metamask.swapsState.quotes;

export const selectHasSwapsQuotes = (state) =>
  Boolean(Object.values(state.metamask.swapsState.quotes || {}).length);

export const getSelectedQuote = (state) => {
  const { selectedAggId, quotes } = getSwapsState(state);
  return quotes[selectedAggId];
};

export const getSwapsTokens = (state) => state.metamask.swapsState.tokens;

export const getTopQuote = (state) => {
  const { topAggId, quotes } = getSwapsState(state);
  return quotes[topAggId];
};

export const getUsedQuote = (state) =>
  getSelectedQuote(state) || getTopQuote(state);

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

export const getCurrentSmartTransactions = (state) => {
  return state.metamask.smartTransactionsState?.smartTransactions?.[
    getCurrentChainId(state)
  ];
};

export const getSmartTransactionFees = (state) => {
  const usedQuote = getUsedQuote(state);
  if (!usedQuote?.isGasIncludedTrade) {
    return state.metamask.smartTransactionsState?.fees;
  }
  return {
    approvalTxFees: usedQuote.approvalTxFees,
    tradeTxFees: usedQuote.tradeTxFees,
  };
};

// Actions / action-creators

const {
  clearSwapsState,
  navigatedBackToBuildQuote,
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

export const navigateBackToPrepareSwap = (navigate) => {
  return async (dispatch) => {
    // TODO: Ensure any fetch in progress is cancelled
    await dispatch(setBackgroundSwapRouteState(''));
    dispatch(navigatedBackToBuildQuote());
    navigate(`${CROSS_CHAIN_SWAP_ROUTE}${PREPARE_SWAP_ROUTE}`);
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

      // TODO: This works, but we should figure out why we are getting a JSON parse error
      if (
        !e.message?.match(
          /NetworkError|Fetch failed with status:|Unexpected end of JSON input/u,
        )
      ) {
        throw e;
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

export const useGetIsEstimatedReturnLow = ({ usedQuote, rawNetworkFees }) => {
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
