import { createSlice } from '@reduxjs/toolkit'

import { resetSwapsPostFetchState } from '../../store/actions'
import { BUILD_QUOTE_ROUTE } from '../../helpers/constants/routes'

const initialState = {
  aggregatorMetadata: null,
  approveTxId: null,
  balanceError: false,
  fetchingQuotes: false,
  fromToken: null,
  quotesFetchStartTime: null,
  submittingSwap: false,
  topAssets: null,
  toToken: null,
}

const slice = createSlice({
  name: 'swaps',
  initialState,
  reducers: {
    clearSwapsState: () => initialState,
    navigatedBackToBuildQuote: (state) => {
      state.approveTxId = null
      state.balanceError = false
      state.submittingSwap = false
    },
    setAggregatorMetadata: (state, action) => {
      state.aggregatorMetadata = action.payload
    },
    setApproveTxId: (state, action) => {
      state.approveTxId = action.payload
    },
    setBalanceError: (state, action) => {
      state.balanceError = action.payload
    },
    setFetchingQuotes: (state, action) => {
      state.fetchingQuotes = action.payload
    },
    setFromToken: (state, action) => {
      state.fromToken = action.payload
    },
    setQuotesFetchStartTime: (state, action) => {
      state.quotesFetchStartTime = action.payload
    },
    setSubmittingSwap: (state, action) => {
      state.submittingSwap = action.payload
    },
    setTopAssets: (state, action) => {
      state.topAssets = action.payload
    },
    setToToken: (state, action) => {
      state.toToken = action.payload
    },
  },
})

const { actions, reducer } = slice

export default reducer

// Actions / action-creators

const {
  clearSwapsState,
  navigatedBackToBuildQuote,
  setAggregatorMetadata,
  setApproveTxId,
  setBalanceError,
  setFetchingQuotes,
  setFromToken,
  setQuotesFetchStartTime,
  setSubmittingSwap,
  setTopAssets,
  setToToken,
} = actions

export {
  clearSwapsState,
  setAggregatorMetadata,
  setApproveTxId,
  setBalanceError,
  setFetchingQuotes,
  setFromToken as setSwapsFromToken,
  setQuotesFetchStartTime as setSwapQuotesFetchStartTime,
  setSubmittingSwap,
  setTopAssets,
  setToToken as setSwapToToken,
}

export const navigateBackToBuildQuote = (history) => {
  return async (dispatch) => {
    await dispatch(resetSwapsPostFetchState())
    dispatch(navigatedBackToBuildQuote())

    history.push(BUILD_QUOTE_ROUTE)
  }
}

// Selectors

export const getAggregatorMetadata = (state) => state.swaps.aggregatorMetadata

export const getApproveTxId = (state) => state.swaps.approveTxId

export const getBalanceError = (state) => state.swaps.balanceError

export const getFetchingQuotes = (state) => state.swaps.fetchingQuotes

export const getFromToken = (state) => state.swaps.fromToken

export const getSubmittingSwap = (state) => state.swaps.submittingSwap

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
