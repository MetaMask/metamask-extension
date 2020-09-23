import { useDispatch, useSelector } from 'react-redux'

import { useHistory, useLocation } from 'react-router-dom'
import BigNumber from 'bignumber.js'

import { LOADING_QUOTES_ROUTE, DEFAULT_ROUTE, ASSET_ROUTE, AWAITING_SWAP_ROUTE, BUILD_QUOTE_ROUTE, VIEW_QUOTE_ROUTE, SWAPS_ERROR_ROUTE } from '../helpers/constants/routes'
import {
  QUOTES_EXPIRED_ERROR,
  ERROR_FETCHING_QUOTES,
  QUOTES_NOT_AVAILABLE_ERROR,
} from '../helpers/constants/swaps'

import {
  getDestinationTokenInfo,
  navigateBackToBuildQuote,
  prepareForRetryGetQuotes,
  setFetchingQuotes,
  setSwapsFromToken,
  getSwapsTokens,
  getMaxMode,
  setSwapQuotesFetchStartTime,
  getSwapsErrorKey,
  signAndSendTransactions,
} from '../ducks/swaps/swaps'
import {
  setInitialGasEstimate,
  setSwapsErrorKey,
  addToken,
  fetchAndSetQuotes,
  setBackgoundSwapRouteState,
} from '../store/actions'
import { getTokenExchangeRates } from '../selectors'
import { calcGasTotal } from '../pages/send/send.utils'

export function useSwapSubmitFunction ({
  maxSlippage,
  inputValue,
  usedGasPrice,
  selectedAccountAddress,
  selectedFromToken,
  selectedToToken,
  balanceError,
  ethBalance,
  isCustomNetwork,
}) {
  const dispatch = useDispatch()
  const history = useHistory()
  const { pathname } = useLocation()
  const isBuildQuoteRoute = pathname === BUILD_QUOTE_ROUTE
  const isViewQuoteRoute = pathname === VIEW_QUOTE_ROUTE
  const isAwaitingSwapRoute = pathname === AWAITING_SWAP_ROUTE
  const isSwapsErrorRoute = pathname === SWAPS_ERROR_ROUTE

  const destinationToken = useSelector(getDestinationTokenInfo)
  const contractExchangeRates = useSelector(getTokenExchangeRates)
  const maxMode = useSelector(getMaxMode)
  const swapsErrorKey = useSelector(getSwapsErrorKey)

  const swapsTokens = useSelector(getSwapsTokens)

  const goToOverviewPage = () => {
    if (destinationToken.symbol === 'ETH') {
      history.push(DEFAULT_ROUTE)
      return
    }
    history.push(`${ASSET_ROUTE}/${destinationToken.address}`)
  }

  const fetchQuotesAndSetQuoteState = async () => {
    const {
      address: fromTokenAddress,
      symbol: fromTokenSymbol,
      decimals: fromTokenDecimals,
      iconUrl: fromTokenIconUrl,
      balance: fromTokenBalance,
    } = selectedFromToken
    const {
      address: toTokenAddress,
      symbol: toTokenSymbol,
      decimals: toTokenDecimals,
      iconUrl: toTokenIconUrl,
    } = selectedToToken
    await dispatch(setBackgoundSwapRouteState('loading'))
    history.push(LOADING_QUOTES_ROUTE)
    dispatch(setFetchingQuotes(true))

    let destinationTokenAddedForSwap = false
    if (toTokenSymbol !== 'ETH' && !contractExchangeRates[toTokenAddress]) {
      destinationTokenAddedForSwap = true
      await dispatch(addToken(toTokenAddress, toTokenSymbol, toTokenDecimals, toTokenIconUrl, true))
    }
    if (fromTokenSymbol !== 'ETH' && !contractExchangeRates[fromTokenAddress] && fromTokenBalance && (new BigNumber(fromTokenBalance, 16)).gt(0)) {
      dispatch(addToken(fromTokenAddress, fromTokenSymbol, fromTokenDecimals, fromTokenIconUrl, true))
    }

    const sourceTokenInfo = swapsTokens?.find(({ address }) => address === fromTokenAddress) || selectedFromToken
    const destinationTokenInfo = swapsTokens?.find(({ address }) => address === toTokenAddress) || selectedToToken

    dispatch(setSwapsFromToken(selectedFromToken))

    let revisedValue
    if (maxMode && sourceTokenInfo.symbol === 'ETH') {
      const totalGasLimitForCalculation = (new BigNumber(800000, 10)).plus(100000, 10).toString(16)
      const gasTotalInWeiHex = calcGasTotal(totalGasLimitForCalculation, usedGasPrice)
      revisedValue = (new BigNumber(ethBalance, 16)).minus(gasTotalInWeiHex, 16).div('1000000000000000000').toString(10)
    }

    try {
      const fetchStartTime = Date.now()
      dispatch(setSwapQuotesFetchStartTime(fetchStartTime))
      const [fetchedQuotes, selectedAggId] = await dispatch(fetchAndSetQuotes(
        {
          slippage: maxSlippage,
          sourceToken: fromTokenAddress,
          destinationToken: toTokenAddress,
          value: revisedValue || inputValue,
          fromAddress: selectedAccountAddress,
          isCustomNetwork,
          destinationTokenAddedForSwap,
          balanceError,
          sourceDecimals: fromTokenDecimals,
        },
        {
          sourceTokenInfo,
          destinationTokenInfo,
        },
      ))
      if (Object.values(fetchedQuotes)?.length === 0) {
        dispatch(setSwapsErrorKey(QUOTES_NOT_AVAILABLE_ERROR))
      } else {
        const newSelectedQuote = fetchedQuotes[selectedAggId]
        dispatch(setInitialGasEstimate(selectedAggId, newSelectedQuote.maxGas))
      }
    } catch (e) {
      dispatch(setSwapsErrorKey(ERROR_FETCHING_QUOTES))
    }

    dispatch(setFetchingQuotes(false))
  }

  if ((isSwapsErrorRoute && swapsErrorKey === QUOTES_EXPIRED_ERROR)) {
    return () => {
      dispatch(prepareForRetryGetQuotes())
      return fetchQuotesAndSetQuoteState()
    }
  }
  if (isBuildQuoteRoute) {
    return fetchQuotesAndSetQuoteState
  }
  if (isSwapsErrorRoute) {
    return async () => await dispatch(navigateBackToBuildQuote(history))
  }
  if (isViewQuoteRoute && (!balanceError || (maxMode && selectedFromToken?.symbol === 'ETH'))) {
    return async () => await dispatch(signAndSendTransactions())
  }
  if ((isViewQuoteRoute && balanceError) || isAwaitingSwapRoute) {
    return goToOverviewPage
  }
  return null
}
