import { useDispatch, useSelector } from 'react-redux'

import { useHistory, useLocation } from 'react-router-dom'

import { DEFAULT_ROUTE, ASSET_ROUTE, AWAITING_SWAP_ROUTE, BUILD_QUOTE_ROUTE, VIEW_QUOTE_ROUTE, SWAPS_ERROR_ROUTE } from '../helpers/constants/routes'
import {
  QUOTES_EXPIRED_ERROR,
} from '../helpers/constants/swaps'

import {
  fetchQuotesAndSetQuoteState,
  getDestinationTokenInfo,
  navigateBackToBuildQuote,
  prepareForRetryGetQuotes,
  getMaxMode,
  getSwapsErrorKey,
  signAndSendTransactions,
} from '../ducks/swaps/swaps'

export function useSwapSubmitFunction ({
  balanceError,
  inputValue,
  maxSlippage,
  selectedFromToken,
}) {
  const dispatch = useDispatch()
  const history = useHistory()
  const { pathname } = useLocation()
  const isBuildQuoteRoute = pathname === BUILD_QUOTE_ROUTE
  const isViewQuoteRoute = pathname === VIEW_QUOTE_ROUTE
  const isAwaitingSwapRoute = pathname === AWAITING_SWAP_ROUTE
  const isSwapsErrorRoute = pathname === SWAPS_ERROR_ROUTE

  const destinationToken = useSelector(getDestinationTokenInfo)
  const maxMode = useSelector(getMaxMode)
  const swapsErrorKey = useSelector(getSwapsErrorKey)

  const goToOverviewPage = () => {
    if (destinationToken.symbol === 'ETH') {
      history.push(DEFAULT_ROUTE)
      return
    }
    history.push(`${ASSET_ROUTE}/${destinationToken.address}`)
  }

  if ((isSwapsErrorRoute && swapsErrorKey === QUOTES_EXPIRED_ERROR)) {
    return async () => {
      dispatch(prepareForRetryGetQuotes())
      await dispatch(fetchQuotesAndSetQuoteState(history, inputValue, maxSlippage))
    }
  }
  if (isBuildQuoteRoute) {
    return async () => await dispatch(fetchQuotesAndSetQuoteState(history, inputValue, maxSlippage))
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
