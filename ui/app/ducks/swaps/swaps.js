// Actions
const SET_FROM_TOKEN = 'metamask/swaps/SET_FROM_TOKEN'
const SET_TO_TOKEN = 'metamask/swaps/SET_TO_TOKEN'
const SET_QUOTES = 'metamask/swaps/SET_QUOTES'
const SET_SUBMITTED_APPROVAL_ID = 'metamask/swaps/SET_SUBMITTED_APPROVAL_ID'
const SET_CONVERSION_ID = 'metamask/swaps/SET_CONVERSION_ID'
const SET_SELECTED_QUOTE = 'metamask/swaps/SET_SELECTED_QUOTE'
const CLEAR_SWAPS_STATE = 'metamask/swaps/CLEAR_SWAPS_STATE'
const SET_TRADE_TX_ID = 'metamask/swaps/SET_TRADE_TX_ID'
const SET_APPROVE_TX_ID = 'metamask/swaps/SET_APPROVE_TX_ID'
const SET_TRADE_TX_PARAMS = 'metamask/swaps/SET_TRADE_TX_PARAMS'
const SET_APPROVE_TX_PARAMS = 'metamask/swaps/SET_APPROVE_TX_PARAMS'
const SET_FETCHING_QUOTES = 'metamask/swaps/SET_FETCHING_QUOTES'
const SET_SHOW_QUOTE_LOADING_SCREEN = 'metamask/swaps/SET_SHOW_QUOTE_LOADING_SCREEN'
const SET_BALANCE_ERROR = 'metamask/swaps/SET_BALANCE_ERROR'
const SET_SWAPS_TOKENS = 'metamask/swaps/SET_SWAPS_TOKENS'
const SET_TOP_ASSETS = 'metamask/swaps/SET_TOP_ASSETS'
const SET_LOADING_QUOTES_ERROR = 'metamask/swaps/SET_LOADING_QUOTES_ERROR'
const SET_AGGREGATOR_METADATA = 'metamask/swaps/SET_AGGREGATOR_METADATA'
const SET_SWAP_QUOTES_FETCH_START_TIME = 'metamask/swaps/SET_SWAP_QUOTES_FETCH_START_TIME'
const SET_BEST_QUOTE_AGG_ID = 'metamask/swaps/SET_BEST_QUOTE_AGG_ID'

const emptyState = {
  fromToken: null,
  toToken: null,
  quotes: [],
  swapsTokens: [],
  submittedApprovalId: null,
  conversionId: null,
  selectedQuote: null,
  gasPrice: null,
  gasLimit: null,
  approveTxId: null,
  tradeTxId: null,
  tradeTxParams: null,
  approveTxParams: null,
  fetchingQuotes: false,
  showQuoteLoadingScreen: false,
  balanceError: false,
  loadingQuotesError: null,
  aggregatorMetadata: null,
  quotesFetchStartTime: null,
  bestQuoteAggId: null,
}

export default function reduceSwaps (state = {}, action) {
  const swapsState = { ...emptyState, ...state }

  switch (action.type) {

    case SET_FROM_TOKEN:
      return {
        ...swapsState,
        fromToken: action.value,
      }

    case SET_TO_TOKEN:
      return {
        ...swapsState,
        toToken: action.value,
      }

    case SET_QUOTES:
      return {
        ...swapsState,
        quotes: action.value,
      }

    case SET_SUBMITTED_APPROVAL_ID:
      return {
        ...swapsState,
        submittedApprovalId: action.value,
      }

    case SET_CONVERSION_ID:
      return {
        ...swapsState,
        conversionId: action.value,
      }

    case SET_SELECTED_QUOTE:
      return {
        ...swapsState,
        selectedQuote: action.value,
      }

    case SET_TRADE_TX_ID:
      return {
        ...swapsState,
        tradeTxId: action.value,
      }

    case SET_APPROVE_TX_ID:
      return {
        ...swapsState,
        approveTxId: action.value,
      }

    case SET_TRADE_TX_PARAMS:
      return {
        ...swapsState,
        tradeTxParams: action.value,
      }

    case SET_APPROVE_TX_PARAMS:
      return {
        ...swapsState,
        approveTxParams: action.value,
      }

    case SET_FETCHING_QUOTES:
      return {
        ...swapsState,
        fetchingQuotes: action.value,
      }

    case SET_SHOW_QUOTE_LOADING_SCREEN:
      return {
        ...swapsState,
        showQuoteLoadingScreen: action.value,
      }

    case SET_BALANCE_ERROR:
      return {
        ...swapsState,
        balanceError: action.value,
      }

    case SET_SWAPS_TOKENS:
      return {
        ...swapsState,
        swapsTokens: action.value,
      }

    case SET_TOP_ASSETS:
      return {
        ...swapsState,
        topAssets: action.value,
      }

    case SET_LOADING_QUOTES_ERROR:
      return {
        ...swapsState,
        loadingQuotesError: action.value,
      }

    case SET_AGGREGATOR_METADATA:
      return {
        ...swapsState,
        aggregatorMetadata: action.value,
      }

    case SET_SWAP_QUOTES_FETCH_START_TIME:
      return {
        ...swapsState,
        quotesFetchStartTime: action.value,
      }

    case SET_BEST_QUOTE_AGG_ID:
      return {
        ...swapsState,
        bestQuoteAggId: action.value,
      }

    case CLEAR_SWAPS_STATE:
      return {
        ...emptyState,
      }

    default:
      return swapsState
  }
}

export function setSwapFromToken (token) {
  return {
    type: SET_FROM_TOKEN,
    value: token,
  }
}

export function setSwapToToken (token) {
  return {
    type: SET_TO_TOKEN,
    value: token,
  }
}

export function setQuotes (quotes) {
  return {
    type: SET_QUOTES,
    value: quotes,
  }
}

export function setSubmittedApprovalId (id) {
  return {
    type: SET_SUBMITTED_APPROVAL_ID,
    value: id,
  }
}

export function setConversionId (id) {
  return {
    type: SET_CONVERSION_ID,
    value: id,
  }
}

export function setSelectedQuote (quote) {
  return {
    type: SET_SELECTED_QUOTE,
    value: quote,
  }
}

export function clearSwapsState () {
  return {
    type: CLEAR_SWAPS_STATE,
  }
}

export function setTradeTxId (id) {
  return {
    type: SET_TRADE_TX_ID,
    value: id,
  }
}

export function setApproveTxId (approveTxId) {
  return {
    type: SET_APPROVE_TX_ID,
    value: approveTxId,
  }
}

export function setTradeTxParams (txParams) {
  return {
    type: SET_TRADE_TX_PARAMS,
    value: txParams,
  }
}

export function setApproveTxParams (txParams) {
  return {
    type: SET_APPROVE_TX_PARAMS,
    value: txParams,
  }
}

export function setFetchingQuotes (fetchingQuotes) {
  return {
    type: SET_FETCHING_QUOTES,
    value: fetchingQuotes,
  }
}

export function setShowQuoteLoadingScreen (showQuoteLoadingScreen) {
  return {
    type: SET_SHOW_QUOTE_LOADING_SCREEN,
    value: showQuoteLoadingScreen,
  }
}

export function setBalanceError (balanceError) {
  return {
    type: SET_BALANCE_ERROR,
    value: balanceError,
  }
}

export function setSwapsTokens (tokens) {
  return {
    type: SET_SWAPS_TOKENS,
    value: tokens,
  }
}

export function setTopAssets (topAssets) {
  return {
    type: SET_TOP_ASSETS,
    value: topAssets,
  }
}

export function setLoadingQuotesError (loadingQuotesError) {
  return {
    type: SET_LOADING_QUOTES_ERROR,
    value: loadingQuotesError,
  }
}

export function setAggregatorMetadata (aggregatorMetadata) {
  return {
    type: SET_AGGREGATOR_METADATA,
    value: aggregatorMetadata,
  }
}

export function setSwapQuotesFetchStartTime (startTime) {
  return {
    type: SET_SWAP_QUOTES_FETCH_START_TIME,
    value: startTime,
  }
}

export function setBestQuoteAggId (aggId) {
  return {
    type: SET_BEST_QUOTE_AGG_ID,
    value: aggId,
  }
}

const getSwapsState = (state) => state.metamask.swapsState

export const getFromToken = (state) => state.swaps.fromToken

export const getToToken = (state) => state.swaps.toToken

export const getSwapsWelcomeMessageSeenStatus = (state) => state.metamask.swapsWelcomeMessageHasBeenShown

export const getQuotes = (state) => state.metamask.swapsState.quotes

export const getFetchParams = (state) => state.metamask.swapsState.fetchParams

export const getSubmittedApprovalId = (state) => state.swaps.submittedApprovalId

export const getConversionId = (state) => state.swaps.conversionId

export const getSwapsGasPrice = (state) => state.swaps.gasPrice

export const getSwapsGasLimit = (state) => state.swaps.gasLimit

export const getTradeTxId = (state) => state.metamask.swapsState.tradeTxId

export const getApproveTxId = (state) => state.swaps.approveTxId

export const getSelectedQuote = (state) => {
  const { selectedAggId, quotes } = getSwapsState(state)
  return quotes[selectedAggId]
}

export const getFetchingQuotes = (state) => state.swaps.fetchingQuotes

export const getShowQuoteLoadingScreen = (state) => state.swaps.showQuoteLoadingScreen

export const getBalanceError = (state) => state.swaps.balanceError

export const getSwapsTokens = (state) => state.metamask.swapsState.tokens

export const getUsedQuote = (state) => getSelectedQuote(state)

export const getTopAssets = (state) => state.swaps.topAssets

export const getLoadingQuotesError = (state) => state.swaps.loadingQuotesError

export const getAggregatorMetadata = (state) => state.swaps.aggregatorMetadata

export const getMaxMode = (state) => state.metamask.swapsState.maxMode

export const getQuotesLastFetched = (state) => state.metamask.swapsState.quotesLastFetched

export const getQuotesStatus = (state) => state.metamask.swapsState.quotesStatus

export const getQuotesFetchStartTime = (state) => state.metamask.quotesFetchStartTime

export const getBackgoundSwapRouteState = (state) => state.metamask.swapsState.routeState

export const getCustomSwapsGas = (state) => state.metamask.swapsState.customMaxGas

export const getCustomSwapsGasPrice = (state) => state.metamask.swapsState.customGasPrice

export const getBestQuoteAggId = (state) => state.swaps.bestQuoteAggId

export const getSwapsTradeTxParams = (state) => {
  const { trade = {} } = getSelectedQuote(state) || {}
  const gas = getCustomSwapsGas(state) || trade.gas
  const gasPrice = getCustomSwapsGasPrice(state) || trade.gasPrice
  return { ...trade, gas, gasPrice }
}

export const getSwapsErrorKey = (state) => getSwapsState(state)?.errorKey

export const getTradeTxParams = (state) => state.metamask.swapsState.tradeTxParams

export const getApproveTxParams = (state) => {
  const { approvalNeeded } = getSelectedQuote(state) || {}

  if (!approvalNeeded) {
    return null
  }
  const data = getSwapsState(state)?.customApproveTxData || approvalNeeded.data

  const gasPrice = getCustomSwapsGasPrice(state) || approvalNeeded.gasPrice
  return { ...approvalNeeded, gasPrice, data }
}
