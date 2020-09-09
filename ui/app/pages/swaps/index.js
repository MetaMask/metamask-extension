import React, { useState, useContext, useEffect, useCallback, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Switch, Route, useLocation, useHistory, Redirect } from 'react-router-dom'
import classnames from 'classnames'
import BigNumber from 'bignumber.js'
import { I18nContext } from '../../contexts/i18n'
import { getSelectedAccount, getCurrentNetworkId } from '../../selectors/selectors'
import {
  getFromToken,
  getToToken,
  getQuotes,
  clearSwapsState,
  getSwapsGasPrice,
  getTradeTxId,
  getApproveTxId,
  getFetchingQuotes,
  setBalanceError,
  getBalanceError,
  setTopAssets,
  getTradeTxParams,
  getFetchParams,
  setAggregatorMetadata,
  getAggregatorMetadata,
  getQuotesStatus,
  getQuotesFetchStartTime,
  getMaxMode,
  getBackgoundSwapRouteState,
  getSwapsErrorKey,
} from '../../ducks/swaps/swaps'
import {
  AWAITING_SWAP_ROUTE,
  BUILD_QUOTE_ROUTE,
  VIEW_QUOTE_ROUTE,
  LOADING_QUOTES_ROUTE,
  SWAPS_ERROR_ROUTE,
  DEFAULT_ROUTE,
} from '../../helpers/constants/routes'
import {
  QUOTES_EXPIRED_ERROR,
  SWAP_FAILED_ERROR,
  ERROR_FETCHING_QUOTES,
  QUOTES_NOT_AVAILABLE_ERROR,
  ETH_SWAPS_TOKEN_OBJECT,
} from '../../helpers/constants/swaps'

import { fetchBasicGasAndTimeEstimates, fetchGasEstimates, resetCustomData } from '../../ducks/gas/gas.duck'
import { resetBackgroundSwapsState, setSwapsTokens, setSwapsTxGasPrice, setQuotes, setMaxMode, removeToken, setBackgoundSwapRouteState } from '../../store/actions'
import { getAveragePriceEstimateInHexWEI, currentNetworkTxListSelector, getCustomNetworkId } from '../../selectors'
import { useSwapSubmitFunction } from '../../hooks/useSwapSubmitFunction'
import PageContainerFooter from '../../components/ui/page-container/page-container-footer'
import { decGWEIToHexWEI, getValueFromWeiHex } from '../../helpers/utils/conversions.util'
import SwapsFooter from './swaps-footer'
import SwapsRouteContainer from './swaps-route-container'
import { fetchTokens, fetchTopAssets, getSwapsTokensReceivedFromTxMeta, fetchAggregatorMetadata } from './swaps.util'
import AwaitingSwap from './awaiting-swap'
import LoadingQuote from './loading-swaps-quotes'
import BuildQuote from './build-quote'
import ViewQuote from './view-quote'

export default function Swap () {
  const t = useContext(I18nContext)
  const history = useHistory()
  const dispatch = useDispatch()

  const { pathname } = useLocation()
  const isBuildQuoteRoute = pathname === BUILD_QUOTE_ROUTE
  const isViewQuoteRoute = pathname === VIEW_QUOTE_ROUTE
  const isLoadingQuoteRoute = pathname === LOADING_QUOTES_ROUTE
  const isAwaitingSwapRoute = pathname === AWAITING_SWAP_ROUTE
  const isSwapsErrorRoute = pathname === SWAPS_ERROR_ROUTE
  const routeState = useSelector(getBackgoundSwapRouteState)

  const tradeTxParams = useSelector(getTradeTxParams)
  const tradeTxParamsTo = tradeTxParams?.to
  const fetchParams = useSelector(getFetchParams)

  const [inputValue, setInputValue] = useState(fetchParams?.value || null)
  const [maxSlippage, setMaxSlippage] = useState(fetchParams?.slippage || 2)

  const selectedAccount = useSelector(getSelectedAccount)
  const { balance: ethBalance, address: selectedAccountAddress } = selectedAccount
  const quotes = useSelector(getQuotes)

  const averageGasEstimate = useSelector(getAveragePriceEstimateInHexWEI)
  const customConvertGasPrice = useSelector(getSwapsGasPrice)
  const usedGasPrice = customConvertGasPrice || tradeTxParams?.gasPrice || averageGasEstimate

  const txList = useSelector(currentNetworkTxListSelector)

  const tradeTxId = useSelector(getTradeTxId)
  const approveTxId = useSelector(getApproveTxId)

  const approveTxData = approveTxId && txList.find(({ id }) => approveTxId === id)
  const tradeTxData = tradeTxId && txList.find(({ id }) => tradeTxId === id)
  const tokensReceived = tradeTxData?.txReceipt && getSwapsTokensReceivedFromTxMeta(
    fetchParams?.destinationTokenInfo?.symbol,
    tradeTxData,
    fetchParams?.destinationTokenInfo?.address,
    selectedAccountAddress,
    fetchParams?.destinationTokenInfo?.decimals,
  )
  const tradeConfirmed = tradeTxData?.status === 'confirmed'

  const approveError = approveTxData?.status === 'failed' || approveTxData?.txReceipt?.status === '0x0'
  const tradeError = tradeTxData?.status === 'failed' || tradeTxData?.txReceipt?.status === '0x0'
  const conversionError = approveError || tradeError

  const aggregatorMetadata = useSelector(getAggregatorMetadata)
  const networkId = useSelector(getCurrentNetworkId)
  const customNetworkId = useSelector(getCustomNetworkId)
  const isCustomNetwork = Boolean(customNetworkId)
  const maxMode = useSelector(getMaxMode)

  const { destinationTokenAddedForSwap } = fetchParams || {}

  const clearTemporaryTokenRef = useRef()
  useEffect(() => {
    clearTemporaryTokenRef.current = () => {
      if (destinationTokenAddedForSwap && (!isAwaitingSwapRoute || conversionError)) {
        dispatch(removeToken(fetchParams?.destinationTokenInfo?.address))
      }
    }
  }, [fetchParams, destinationTokenAddedForSwap, conversionError, dispatch, isAwaitingSwapRoute])
  useEffect(() => {
    return () => {
      clearTemporaryTokenRef.current()
    }
  }, [])

  const initialDataFetch = useCallback(() => {
    dispatch(fetchBasicGasAndTimeEstimates())
      .then((basicEstimates) => {
        if (tradeTxParamsTo) {
          dispatch(setSwapsTxGasPrice(decGWEIToHexWEI(basicEstimates.average)))
        }
        return basicEstimates.blockTime
      })
      .then((blockTime) => {
        dispatch(fetchGasEstimates(blockTime, true))
      })

  }, [dispatch, tradeTxParamsTo])

  useEffect(() => {
    initialDataFetch()
  }, [initialDataFetch])

  useEffect(() => {
    fetchTokens(isCustomNetwork)
      .then((tokens) => {
        dispatch(setSwapsTokens(tokens))
      })
      .catch((error) => console.error(error))

    fetchTopAssets(isCustomNetwork)
      .then((topAssets) => {
        dispatch(setTopAssets(topAssets))
      })

    fetchAggregatorMetadata(isCustomNetwork)
      .then((newAggregatorMetadata) => {
        dispatch(setAggregatorMetadata(newAggregatorMetadata))
      })

    return () => {
      dispatch(resetCustomData())
      dispatch(clearSwapsState())
      dispatch(resetBackgroundSwapsState())
    }
  }, [dispatch, isCustomNetwork])

  const fetchingQuotes = useSelector(getFetchingQuotes)
  const balanceError = useSelector(getBalanceError)
  const selectedToToken = useSelector(getToToken) || fetchParams?.destinationTokenInfo || {}
  const fetchParamsFromToken = fetchParams?.sourceTokenInfo?.symbol === 'ETH'
    ? { ...ETH_SWAPS_TOKEN_OBJECT, string: getValueFromWeiHex({ value: ethBalance, numberOfDecimals: 4, toDenomination: 'ETH' }), balance: ethBalance }
    : fetchParams?.sourceTokenInfo
  const selectedFromToken = useSelector(getFromToken) || fetchParamsFromToken || {}

  const cancelAll = () => {
    exitedSwapsEvent()
    dispatch(clearSwapsState())
    dispatch(resetBackgroundSwapsState())
    history.push(DEFAULT_ROUTE)
  }

  const [submittingSwap, setSubmittingSwap] = useState(false)
  const [loadingQuotesDone, setLoadingQuotesDone] = useState(false)

  const quotesStatus = useSelector(getQuotesStatus)
  const swapsErrorKey = useSelector(getSwapsErrorKey)

  const onSubmit = useSwapSubmitFunction({
    maxSlippage,
    inputValue,
    usedGasPrice,
    selectedAccountAddress,
    selectedFromToken,
    selectedToToken,
    balanceError,
    tradeConfirmed,
    conversionError,
    setInputValue,
    ethBalance,
    setSubmittingSwap,
    networkId,
    isCustomNetwork,
    quotesStatus,
    fetchingQuotes,
    quotesRequestCancelledEvent,
  })
  const onRetry = useSwapSubmitFunction({ isRetry: true })

  if (swapsErrorKey && !isSwapsErrorRoute) {
    history.push(SWAPS_ERROR_ROUTE)
  }

  return (
    <div className="swaps">
      <div className="swaps__container">
        <div className="swaps__header">
          <div className="swaps__title">
            {t('swap')}
          </div>
          {!isAwaitingSwapRoute && (
            <div
              className="swaps__header-cancel"
              onClick={cancelAll}
            >
              { t('cancel') }
            </div>
          )}
        </div>
        <div className="swaps__content">
          <Switch>
            <Route
              path={BUILD_QUOTE_ROUTE}
              exact
              render={() => {
                if (tradeTxData && !conversionError) {
                  return <Redirect to={{ pathname: AWAITING_SWAP_ROUTE }} />
                } else if (tradeTxData) {
                  return <Redirect to={{ pathname: SWAPS_ERROR_ROUTE }} />
                } else if (routeState === 'loading') {
                  return <Redirect to={{ pathname: LOADING_QUOTES_ROUTE }} />
                }

                const onInputChange = (newInputValue, balance) => {
                  setInputValue(newInputValue)
                  dispatch(setBalanceError(new BigNumber(newInputValue || 0).gt(balance || 0)))
                }

                return (
                  <BuildQuote
                    inputValue={inputValue}
                    selectedFromToken={selectedFromToken}
                    onInputChange={onInputChange}
                    ethBalance={ethBalance}
                    setMaxSlippage={setMaxSlippage}
                    setMaxMode={setMaxMode}
                    selectedAccountAddress={selectedAccountAddress}
                    onSubmit={onSubmit}
                  />
                )
              }}
            />
            <Route
              path={VIEW_QUOTE_ROUTE}
              exact
              render={() => {
                if (quotes.length) {
                  return (<ViewQuote numberOfQuotes={quotes.length} setInputValue={setInputValue} onSubmit={onSubmit} onCancel={onRetry} />)
                } else if (fetchParams) {
                  return <Redirect to={{ pathname: SWAPS_ERROR_ROUTE }} />
                }
                return <Redirect to={{ pathname: BUILD_QUOTE_ROUTE }} />
              }}
            />
            <Route
              path={SWAPS_ERROR_ROUTE}
              exact
              render={() => {
                if (swapsErrorKey) {
                  return (
                    <AwaitingSwap
                      swapComplete={tradeConfirmed}
                      symbol={fetchParams?.destinationTokenInfo?.symbol}
                      networkId={networkId}
                      txHash={tradeTxData?.hash}
                      tokensReceived={tokensReceived}
                      tradeTxData={tradeTxData}
                      usedGasPrice={usedGasPrice}
                      submittingSwap={submittingSwap}
                      onSubmit={onSubmit}
                    />
                  )
                }
                return <Redirect to={{ pathname: BUILD_QUOTE_ROUTE }} />

              }}
            />
            <Route
              path={LOADING_QUOTES_ROUTE}
              exact
              render={() => {
                return aggregatorMetadata
                  ? (
                    <LoadingQuote
                      loadingComplete={!fetchingQuotes}
                      onDone={async () => {
                        await dispatch(setBackgoundSwapRouteState(''))

                        if (swapsErrorKey === ERROR_FETCHING_QUOTES || swapsErrorKey === QUOTES_NOT_AVAILABLE_ERROR) {
                          setLoadingQuotesDone(true)
                          history.push(SWAPS_ERROR_ROUTE)
                        } else {
                          history.push(VIEW_QUOTE_ROUTE)
                        }
                      }}
                      aggregatorMetadata={aggregatorMetadata}
                      onSubmit={onRetry}
                    />
                  )
                  : <Redirect to={{ pathname: BUILD_QUOTE_ROUTE }} />
              }}
            />
            <Route
              path={AWAITING_SWAP_ROUTE}
              exact
              render={() => {
                return submittingSwap || tradeTxData
                  ? (
                    <AwaitingSwap
                      swapComplete={tradeConfirmed}
                      symbol={fetchParams?.destinationTokenInfo?.symbol}
                      networkId={networkId}
                      txHash={tradeTxData?.hash}
                      tokensReceived={tokensReceived}
                      tradeTxData={tradeTxData}
                      usedGasPrice={usedGasPrice}
                      submittingSwap={submittingSwap}
                      onSubmit={onSubmit}
                    />
                  )
                  : <Redirect to={{ pathname: DEFAULT_ROUTE }} />
              }}
            />
          </Switch>
        </div>
      </div>
    </div>
  )
}
