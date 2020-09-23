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
  getDestinationTokenInfo,
  navigateBackToBuildQuote,
  prepareForRetryGetQuotes,
  setApproveTxId,
  getFetchParams,
  setFetchingQuotes,
  setSwapsFromToken,
  getSwapsTokens,
  getSelectedQuote,
  getMaxMode,
  setSwapQuotesFetchStartTime,
  getSwapsTradeTxParams,
  getSwapsErrorKey,
  setSubmittingSwap,
  getTopQuote,
} from '../ducks/swaps/swaps'
import {
  setInitialGasEstimate,
  setSwapsErrorKey,
  setTradeTxId,
  addUnapprovedTransaction,
  updateAndApproveTx,
  forceUpdateMetamaskState,
  updateTransaction,
  addToken,
  fetchAndSetQuotes,
  setShowAwaitingSwapScreen,
  stopPollingForQuotes,
  setBackgoundSwapRouteState,
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
  networkId,
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
  const tradeTxParams = useSelector(getSwapsTradeTxParams)
  const approveTxParams = useSelector(getApproveTxParams)
  const fetchParams = useSelector(getFetchParams)
  const contractExchangeRates = useSelector(getTokenExchangeRates)
  const topQuote = useSelector(getTopQuote)
  const selectedQuote = useSelector(getSelectedQuote)
  const usedQuote = selectedQuote || topQuote
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

  const signAndSendTransactions = async () => {
    const { metaData, value: swapTokenValue, slippage } = fetchParams
    const { sourceTokenInfo = {}, destinationTokenInfo = {} } = metaData
    history.push(AWAITING_SWAP_ROUTE)

    dispatch(stopPollingForQuotes())

    dispatch(setSubmittingSwap(true))
    let usedTradeTxParams = usedQuote.trade

    const estimatedGasLimitWithMultiplier = (new BigNumber(usedQuote?.gasEstimate || decimalToHex(usedQuote?.averageGas || 0), 16).times(1.4, 10)).round(0).toString(16)
    const maxGasLimit = hexMax((`0x${decimalToHex(usedQuote?.maxGas || 0)}`), estimatedGasLimitWithMultiplier)
    usedTradeTxParams.gas = maxGasLimit

    const totalGasLimitForCalculation = (new BigNumber(usedTradeTxParams.gas, 16)).plus(usedQuote.approvalNeeded?.gas || '0x0', 16).toString(16)
    const gasTotalInWeiHex = calcGasTotal(totalGasLimitForCalculation, usedGasPrice)
    if (maxMode && sourceTokenInfo.symbol === 'ETH') {
      const revisedTradeValue = (new BigNumber(ethBalance, 16)).minus(gasTotalInWeiHex, 16).toString(10)
      const [revisedQuote] = await fetchTradesInfo({
        sourceToken: sourceTokenInfo.address,
        destinationToken: destinationTokenInfo.address,
        slippage,
        value: revisedTradeValue,
        exchangeList: usedQuote.aggregator,
        fromAddress: selectedAccountAddress,
        timeout: 10000,
        networkId,
        isCustomNetwork,
        sourceDecimals: 18,
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
      const approveTxMeta = await dispatch(addUnapprovedTransaction({ ...approveTxParams, amount: '0x0' }, 'metamask'))
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
    await dispatch(updateAndApproveTx(finalTradeTxMeta, true))

    await forceUpdateMetamaskState(dispatch)
    dispatch(setShowAwaitingSwapScreen(true))
    dispatch(setSubmittingSwap(false))
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
    return signAndSendTransactions
  }
  if ((isViewQuoteRoute && balanceError) || isAwaitingSwapRoute) {
    return goToOverviewPage
  }
  return null
}
