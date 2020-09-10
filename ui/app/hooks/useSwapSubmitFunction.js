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
  getApproveTxParams,
  setApproveTxId,
  getFetchParams,
  setFetchingQuotes,
  setSwapsFromToken,
  getSwapsTokens,
  getSelectedQuote,
  getMaxMode,
  setBalanceError,
  setSwapQuotesFetchStartTime,
  getSwapsTradeTxParams,
  getSwapsErrorKey,
} from '../ducks/swaps/swaps'
import {
  setInitialGasEstimate,
  setSwapsErrorKey,
  resetSwapsPostFetchState,
  setTradeTxId,
  addUnapprovedTransaction,
  updateAndApproveTx,
  setQuotes,
  forceUpdateMetamaskState,
  updateTransaction,
  addToken,
  fetchAndSetQuotes,
  resetBackgroundSwapsState,
  setShowAwaitingSwapScreen,
  setQuotesStatus,
  stopPollingForQuotes,
  setBackgoundSwapRouteState,
  setSelectedQuoteAggId,
} from '../store/actions'
import { fetchTradesInfo } from '../pages/swaps/swaps.util'
import { getTokenExchangeRates } from '../selectors'
import { calcGasTotal } from '../pages/send/send.utils'
import { constructTxParams } from '../helpers/utils/util'

import { decimalToHex, hexMax } from '../helpers/utils/conversions.util'

export function useSwapSubmitFunction ({
  maxSlippage,
  inputValue,
  usedGasPrice,
  selectedAccountAddress,
  selectedFromToken,
  selectedToToken,
  balanceError,
  ethBalance,
  setSubmittingSwap,
  networkId,
  isCustomNetwork,
  isRetry,
}) {
  const dispatch = useDispatch()
  const history = useHistory()
  const { pathname } = useLocation()
  const retry = () => {
    dispatch(resetSwapsPostFetchState())
    dispatch(setBalanceError(false))
    setSubmittingSwap(false)

    history.push(BUILD_QUOTE_ROUTE)
  }
  const isBuildQuoteRoute = pathname === BUILD_QUOTE_ROUTE
  const isViewQuoteRoute = pathname === VIEW_QUOTE_ROUTE
  const isAwaitingSwapRoute = pathname === AWAITING_SWAP_ROUTE
  const isSwapsErrorRoute = pathname === SWAPS_ERROR_ROUTE
  const isLoadingQuoteRoute = pathname === LOADING_QUOTES_ROUTE

  const tradeTxParams = useSelector(getSwapsTradeTxParams)
  const approveTxParams = useSelector(getApproveTxParams)
  const fetchParams = useSelector(getFetchParams)
  const contractExchangeRates = useSelector(getTokenExchangeRates)
  const selectedQuote = useSelector(getSelectedQuote)
  const maxMode = useSelector(getMaxMode)
  const swapsErrorKey = useSelector(getSwapsErrorKey)

  const swapsTokens = useSelector(getSwapsTokens)

  const goHome = () => {
    dispatch(setBalanceError(false))
    dispatch(resetBackgroundSwapsState())
    setSubmittingSwap(false)

    history.push(DEFAULT_ROUTE)
  }
  const goToToken = () => {
    dispatch(setBalanceError(false))
    dispatch(resetBackgroundSwapsState())
    setSubmittingSwap(false)

    history.push(`${ASSET_ROUTE}/${selectedToToken.address}`)
  }
  if (isRetry) {
    return retry
  }

  const signAndSendTransactions = async () => {
    const { sourceTokenInfo = {}, destinationTokenInfo = {}, value: swapTokenValue, slippage } = fetchParams
    history.push(AWAITING_SWAP_ROUTE)

    dispatch(stopPollingForQuotes())

    setSubmittingSwap(true)
    let usedTradeTxParams = tradeTxParams

    const estimatedGasLimitWithMultiplier = (new BigNumber(selectedQuote.gasEstimate || selectedQuote.averageGas || '0x0', 16).times(1.4, 10)).round(0).toString(16)
    const maxGasLimit = hexMax((`0x${decimalToHex(selectedQuote?.maxGas || 0)}`), estimatedGasLimitWithMultiplier)
    usedTradeTxParams.gas = maxGasLimit

    const totalGasLimitForCalculation = (new BigNumber(usedTradeTxParams.gas, 16)).plus(selectedQuote.approvalNeeded?.gas || '0x0', 16).toString(16)
    const gasTotalInWeiHex = calcGasTotal(totalGasLimitForCalculation, usedGasPrice)
    if (maxMode && sourceTokenInfo.symbol === 'ETH') {
      const revisedTradeValue = (new BigNumber(ethBalance, 16)).minus(gasTotalInWeiHex, 16).toString(10)
      const [revisedQuote] = await fetchTradesInfo({
        sourceToken: sourceTokenInfo.address,
        destinationToken: destinationTokenInfo.address,
        slippage,
        value: revisedTradeValue,
        exchangeList: selectedQuote.aggregator,
        fromAddress: selectedAccountAddress,
        timeout: 10000,
        networkId,
        isCustomNetwork,
      })
      const tradeForGasEstimate = { ...revisedQuote.trade }
      delete tradeForGasEstimate.gas
      usedTradeTxParams = constructTxParams({
        ...revisedQuote.trade,
        gas: decimalToHex(usedTradeTxParams.gas),
        amount: decimalToHex(revisedQuote.trade.value),
        gasPrice: tradeTxParams.gasPrice,
      })
    }

    if (approveTxParams) {
      const approveTxMeta = await dispatch(addUnapprovedTransaction(approveTxParams, 'metamask'))
      dispatch(setApproveTxId(approveTxMeta.id))
      const finalApproveTxMeta = await (dispatch(updateTransaction({
        ...approveTxMeta,
        sourceTokenSymbol: sourceTokenInfo.symbol,
      }, true)))
      await dispatch(updateAndApproveTx(finalApproveTxMeta, true))
    }

    const tradeTxMeta = await dispatch(addUnapprovedTransaction(usedTradeTxParams, 'metamask'))
    dispatch(setTradeTxId(tradeTxMeta.id))
    const finalTradeTxMeta = await (dispatch(updateTransaction({
      ...tradeTxMeta,
      sourceTokenSymbol: sourceTokenInfo.symbol,
      destinationTokenSymbol: destinationTokenInfo.symbol,
      swapTokenValue,
    }, true)))
    await dispatch(updateAndApproveTx(finalTradeTxMeta, 'metamask', true))

    await forceUpdateMetamaskState(dispatch)
    dispatch(setShowAwaitingSwapScreen(true))
    setSubmittingSwap(false)
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
    await dispatch(setQuotesStatus(''))
    history.push(LOADING_QUOTES_ROUTE)
    await dispatch(setBackgoundSwapRouteState('loading'))
    dispatch(setFetchingQuotes(true))

    let destinationTokenAddedForSwap = false
    if (toTokenSymbol !== 'ETH' && !contractExchangeRates[toTokenAddress]) {
      destinationTokenAddedForSwap = true
      await dispatch(addToken(toTokenAddress, toTokenSymbol, toTokenDecimals, toTokenIconUrl))
    }
    if (fromTokenSymbol !== 'ETH' && !contractExchangeRates[fromTokenAddress] && fromTokenBalance && (new BigNumber(fromTokenBalance, 16)).gt(0)) {
      dispatch(addToken(fromTokenAddress, fromTokenSymbol, fromTokenDecimals, fromTokenIconUrl))
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
      const [fetchedQuotes, selectedAggId] = await dispatch(fetchAndSetQuotes({
        sourceTokenInfo,
        destinationTokenInfo,
        slippage: maxSlippage,
        sourceToken: fromTokenAddress,
        destinationToken: toTokenAddress,
        value: revisedValue || inputValue,
        fromAddress: selectedAccountAddress,
        sourceSymbol: fromTokenSymbol,
        sourceDecimals: fromTokenDecimals,
        networkId,
        isCustomNetwork,
        destinationTokenAddedForSwap,
        balanceError,
      }))
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
      dispatch(setSwapsErrorKey(''))
      dispatch(setTradeTxId(null))
      dispatch(setSelectedQuoteAggId(''))
      return fetchQuotesAndSetQuoteState()
    }
  }
  if (isBuildQuoteRoute) {
    return fetchQuotesAndSetQuoteState
  }
  if (isSwapsErrorRoute) {
    return retry
  }
  if (isViewQuoteRoute && (!balanceError || (maxMode && selectedFromToken?.symbol === 'ETH'))) {
    return signAndSendTransactions
  }
  if ((isViewQuoteRoute && balanceError) || isAwaitingSwapRoute) {
    return selectedToToken.symbol === 'ETH' ? goHome : goToToken
  }
  if (isLoadingQuoteRoute) {
    return async () => {
      await dispatch(setBackgoundSwapRouteState(''))
      dispatch(setQuotes([]))
      history.push(BUILD_QUOTE_ROUTE)
    }
  }
  return null
}
