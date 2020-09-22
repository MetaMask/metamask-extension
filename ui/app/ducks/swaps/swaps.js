// Actions
const SET_FROM_TOKEN = 'metamask/swaps/SET_FROM_TOKEN'
const SET_TO_TOKEN = 'metamask/swaps/SET_TO_TOKEN'
const CLEAR_SWAPS_STATE = 'metamask/swaps/CLEAR_SWAPS_STATE'
const SET_APPROVE_TX_ID = 'metamask/swaps/SET_APPROVE_TX_ID'
const SET_FETCHING_QUOTES = 'metamask/swaps/SET_FETCHING_QUOTES'
const SET_BALANCE_ERROR = 'metamask/swaps/SET_BALANCE_ERROR'
const SET_TOP_ASSETS = 'metamask/swaps/SET_TOP_ASSETS'
const SET_AGGREGATOR_METADATA = 'metamask/swaps/SET_AGGREGATOR_METADATA'
const SET_SWAP_QUOTES_FETCH_START_TIME = 'metamask/swaps/SET_SWAP_QUOTES_FETCH_START_TIME'

const emptyState = {
  fromToken: null,
  toToken: null,
  approveTxId: null,
  fetchingQuotes: false,
  balanceError: false,
  aggregatorMetadata: null,
  quotesFetchStartTime: null,
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

    case SET_APPROVE_TX_ID:
      return {
        ...swapsState,
        approveTxId: action.value,
      }

    case SET_FETCHING_QUOTES:
      return {
        ...swapsState,
        fetchingQuotes: action.value,
      }

    case SET_BALANCE_ERROR:
      return {
        ...swapsState,
        balanceError: action.value,
      }

    case SET_TOP_ASSETS:
      return {
        ...swapsState,
        topAssets: action.value,
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

    case CLEAR_SWAPS_STATE:
      return {
        ...emptyState,
      }

    default:
      return swapsState
  }
}

export function setSwapsFromToken (token) {
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

export function clearSwapsState () {
  return {
    type: CLEAR_SWAPS_STATE,
  }
}

export function setApproveTxId (approveTxId) {
  return {
    type: SET_APPROVE_TX_ID,
    value: approveTxId,
  }
}

export function setFetchingQuotes (fetchingQuotes) {
  return {
    type: SET_FETCHING_QUOTES,
    value: fetchingQuotes,
  }
}

export function setBalanceError (balanceError) {
  return {
    type: SET_BALANCE_ERROR,
    value: balanceError,
  }
}

export function setTopAssets (topAssets) {
  return {
    type: SET_TOP_ASSETS,
    value: topAssets,
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

// Selectors

export const getAggregatorMetadata = (state) => state.swaps.aggregatorMetadata

export const getApproveTxId = (state) => state.swaps.approveTxId

export const getBalanceError = (state) => state.swaps.balanceError

export const getFetchingQuotes = (state) => state.swaps.fetchingQuotes

export const getFromToken = (state) => state.swaps.fromToken

export const getSwapsGasPrice = (state) => state.swaps.gasPrice

export const getTopAssets = (state) => state.swaps.topAssets

export const getToToken = (state) => state.swaps.toToken

// Background selectors

const getSwapsState = (state) => state.metamask.swapsState

export const getBackgoundSwapRouteState = (state) => state.metamask.swapsState.routeState

export const getCustomSwapsGas = (state) => state.metamask.swapsState.customMaxGas

export const getCustomSwapsGasPrice = (state) => state.metamask.swapsState.customGasPrice

export const getFetchParams = (state) => state.metamask.swapsState.fetchParams

export const getMaxMode = (state) => state.metamask.swapsState.maxMode

export const getQuotes = (state) => state.metamask.swapsState.quotes

export const getQuotesLastFetched = (state) => state.metamask.swapsState.quotesLastFetched

export const getSelectedQuote = (state) => {
  const { selectedAggId, quotes } = getSwapsState(state)
  return quotes[selectedAggId]
}

export const getSwapsErrorKey = (state) => getSwapsState(state)?.errorKey

export const getSwapsTokens = (state) => state.metamask.swapsState.tokens

export const getSwapsWelcomeMessageSeenStatus = (state) => state.metamask.swapsWelcomeMessageHasBeenShown

export const getTopQuote = (state) => {
  const { topAggId, quotes } = getSwapsState(state)
  return quotes[topAggId]
}

export const getTradeTxId = (state) => state.metamask.swapsState.tradeTxId

export const getTradeTxParams = (state) => state.metamask.swapsState.tradeTxParams

export const getUsedQuote = (state) => getSelectedQuote(state) || getTopQuote(state)

// Compound selectors

export const getSwapsTradeTxParams = (state) => {
  const { selectedAggId, topAggId, quotes } = getSwapsState(state)
  const usedQuote = selectedAggId ? quotes[selectedAggId] : quotes[topAggId]
  if (!usedQuote) {
    return null
  }
  const { trade } = usedQuote
  const gas = getCustomSwapsGas(state) || trade.gas
  const gasPrice = getCustomSwapsGasPrice(state) || trade.gasPrice
  return { ...trade, gas, gasPrice }
}

export const getApproveTxParams = (state) => {
  const { approvalNeeded } = getSelectedQuote(state) || getTopQuote(state) || {}

  if (!approvalNeeded) {
    return null
  }
  const data = getSwapsState(state)?.customApproveTxData || approvalNeeded.data

  const gasPrice = getCustomSwapsGasPrice(state) || approvalNeeded.gasPrice
  return { ...approvalNeeded, gasPrice, data }
}
