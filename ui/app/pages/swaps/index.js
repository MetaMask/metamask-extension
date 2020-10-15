import React, { useState, useEffect, useRef, useContext } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Switch, Route, useLocation, useHistory, Redirect } from 'react-router-dom'
import BigNumber from 'bignumber.js'
import { I18nContext } from '../../contexts/i18n'
import { getSelectedAccount, getCurrentNetworkId } from '../../selectors/selectors'
import {
  getFromToken,
  getQuotes,
  clearSwapsState,
  getTradeTxId,
  getApproveTxId,
  getFetchingQuotes,
  setBalanceError,
  getCustomSwapsGasPrice,
  setTopAssets,
  getSwapsTradeTxParams,
  getFetchParams,
  setAggregatorMetadata,
  getAggregatorMetadata,
  getBackgroundSwapRouteState,
  getSwapsErrorKey,
  setMetamaskFeeAmount,
  getSwapsFeatureLiveness,
  prepareToLeaveSwaps,
  fetchAndSetSwapsGasPriceInfo,
} from '../../ducks/swaps/swaps'
import { resetCustomGasState } from '../../ducks/gas/gas.duck'
import {
  AWAITING_SWAP_ROUTE,
  BUILD_QUOTE_ROUTE,
  VIEW_QUOTE_ROUTE,
  LOADING_QUOTES_ROUTE,
  SWAPS_ERROR_ROUTE,
  DEFAULT_ROUTE,
  SWAPS_MAINTENANCE_ROUTE,
} from '../../helpers/constants/routes'
import {
  ERROR_FETCHING_QUOTES,
  QUOTES_NOT_AVAILABLE_ERROR,
  ETH_SWAPS_TOKEN_OBJECT,
  SWAP_FAILED_ERROR,
  OFFLINE_FOR_MAINTENANCE,
} from '../../helpers/constants/swaps'

import { resetBackgroundSwapsState, setSwapsTokens, removeToken, setBackgroundSwapRouteState, setSwapsErrorKey } from '../../store/actions'
import { getFastPriceEstimateInHexWEI, currentNetworkTxListSelector, getRpcPrefsForCurrentProvider } from '../../selectors'
import { useNewMetricEvent } from '../../hooks/useMetricEvent'
import { getValueFromWeiHex } from '../../helpers/utils/conversions.util'

import FeatureToggledRoute from '../../helpers/higher-order-components/feature-toggled-route'
import { fetchTokens, fetchTopAssets, getSwapsTokensReceivedFromTxMeta, fetchAggregatorMetadata, fetchMetaMaskFeeAmount } from './swaps.util'
import AwaitingSwap from './awaiting-swap'
import LoadingQuote from './loading-swaps-quotes'
import BuildQuote from './build-quote'
import ViewQuote from './view-quote'

export default function Swap () {
  const t = useContext(I18nContext)
  const history = useHistory()
  const dispatch = useDispatch()

  const { pathname } = useLocation()
  const isAwaitingSwapRoute = pathname === AWAITING_SWAP_ROUTE
  const isSwapsErrorRoute = pathname === SWAPS_ERROR_ROUTE
  const isLoadingQuotesRoute = pathname === LOADING_QUOTES_ROUTE

  const fetchParams = useSelector(getFetchParams)
  const { sourceTokenInfo = {}, destinationTokenInfo = {} } = fetchParams?.metaData || {}

  const [inputValue, setInputValue] = useState(fetchParams?.value || '')
  const [maxSlippage, setMaxSlippage] = useState(fetchParams?.slippage || 2)

  const routeState = useSelector(getBackgroundSwapRouteState)
  const tradeTxParams = useSelector(getSwapsTradeTxParams)
  const selectedAccount = useSelector(getSelectedAccount)
  const quotes = useSelector(getQuotes)
  const fastGasEstimate = useSelector(getFastPriceEstimateInHexWEI)
  const customConvertGasPrice = useSelector(getCustomSwapsGasPrice)
  const txList = useSelector(currentNetworkTxListSelector)
  const tradeTxId = useSelector(getTradeTxId)
  const approveTxId = useSelector(getApproveTxId)
  const aggregatorMetadata = useSelector(getAggregatorMetadata)
  const networkId = useSelector(getCurrentNetworkId)
  const rpcPrefs = useSelector(getRpcPrefsForCurrentProvider)
  const fetchingQuotes = useSelector(getFetchingQuotes)
  let swapsErrorKey = useSelector(getSwapsErrorKey)
  const swapsEnabled = useSelector(getSwapsFeatureLiveness)

  const { balance: ethBalance, address: selectedAccountAddress } = selectedAccount
  const fetchParamsFromToken = sourceTokenInfo?.symbol === 'ETH'
    ? { ...ETH_SWAPS_TOKEN_OBJECT, string: getValueFromWeiHex({ value: ethBalance, numberOfDecimals: 4, toDenomination: 'ETH' }), balance: ethBalance }
    : sourceTokenInfo
  const selectedFromToken = useSelector(getFromToken) || fetchParamsFromToken || {}
  const { destinationTokenAddedForSwap } = fetchParams || {}

  const usedGasPrice = customConvertGasPrice || tradeTxParams?.gasPrice || fastGasEstimate
  const approveTxData = approveTxId && txList.find(({ id }) => approveTxId === id)
  const tradeTxData = tradeTxId && txList.find(({ id }) => tradeTxId === id)
  const tokensReceived = tradeTxData?.txReceipt && getSwapsTokensReceivedFromTxMeta(
    destinationTokenInfo?.symbol,
    tradeTxData,
    destinationTokenInfo?.address,
    selectedAccountAddress,
    destinationTokenInfo?.decimals,
    approveTxData,
  )
  const tradeConfirmed = tradeTxData?.status === 'confirmed'
  const approveError = approveTxData?.status === 'failed' || approveTxData?.txReceipt?.status === '0x0'
  const tradeError = tradeTxData?.status === 'failed' || tradeTxData?.txReceipt?.status === '0x0'
  const conversionError = approveError || tradeError

  if (conversionError) {
    swapsErrorKey = SWAP_FAILED_ERROR
  }

  const clearTemporaryTokenRef = useRef()
  useEffect(
    () => {
      clearTemporaryTokenRef.current = () => {
        if (destinationTokenAddedForSwap && (!isAwaitingSwapRoute || conversionError)) {
          dispatch(removeToken(destinationTokenInfo?.address))
        }
      }
    },
    [
      conversionError,
      dispatch,
      destinationTokenAddedForSwap,
      destinationTokenInfo,
      fetchParams,
      isAwaitingSwapRoute,
    ],
  )
  useEffect(() => {
    return () => {
      clearTemporaryTokenRef.current()
    }
  }, [])

  useEffect(() => {
    fetchTokens()
      .then((tokens) => {
        dispatch(setSwapsTokens(tokens))
      })
      .catch((error) => console.error(error))

    fetchTopAssets()
      .then((topAssets) => {
        dispatch(setTopAssets(topAssets))
      })

    fetchAggregatorMetadata()
      .then((newAggregatorMetadata) => {
        dispatch(setAggregatorMetadata(newAggregatorMetadata))
      })

    fetchMetaMaskFeeAmount()
      .then((metaMaskFeeAmount) => {
        dispatch(setMetamaskFeeAmount(metaMaskFeeAmount))
      })

    dispatch(resetCustomGasState())
    dispatch(fetchAndSetSwapsGasPriceInfo())

    return () => {
      dispatch(prepareToLeaveSwaps())
    }
  }, [dispatch])

  const exitedSwapsEvent = useNewMetricEvent({
    event: 'Exited Swaps',
    category: 'swaps',
  })
  const anonymousExitedSwapsEvent = useNewMetricEvent({
    event: 'Exited Swaps',
    category: 'swaps',
    excludeMetaMetricsId: true,
    properties: {
      token_from: fetchParams?.sourceTokenInfo?.symbol,
      token_from_amount: fetchParams?.value,
      request_type: fetchParams?.balanceError,
      token_to: fetchParams?.destinationTokenInfo?.symbol,
      slippage: fetchParams?.slippage,
      custom_slippage: fetchParams?.slippage !== 2,
      current_screen: pathname.match(/\/swaps\/(.+)/u)[1],
    },
  })
  const exitEventRef = useRef()
  useEffect(() => {
    exitEventRef.current = () => {
      exitedSwapsEvent()
      anonymousExitedSwapsEvent()
    }
  })

  useEffect(() => {
    return () => {
      exitEventRef.current()
    }
  }, [])

  useEffect(() => {
    if (swapsErrorKey && !isSwapsErrorRoute) {
      history.push(SWAPS_ERROR_ROUTE)
    }
  }, [history, swapsErrorKey, isSwapsErrorRoute])

  const beforeUnloadEventAddedRef = useRef()
  useEffect(() => {
    const fn = () => {
      clearTemporaryTokenRef.current()
      if (isLoadingQuotesRoute) {
        dispatch(prepareToLeaveSwaps())
      }
      return null
    }
    if (isLoadingQuotesRoute && !beforeUnloadEventAddedRef.current) {
      beforeUnloadEventAddedRef.current = true
      window.addEventListener('beforeunload', fn)
    }
    return () => window.removeEventListener('beforeunload', fn)
  }, [dispatch, isLoadingQuotesRoute])

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
              onClick={async () => {
                clearTemporaryTokenRef.current()
                dispatch(clearSwapsState())
                await dispatch(resetBackgroundSwapsState())
                history.push(DEFAULT_ROUTE)
              }}
            >
              { t('cancel') }
            </div>
          )}
        </div>
        <div className="swaps__content">
          <Switch>
            <FeatureToggledRoute
              redirectRoute={SWAPS_MAINTENANCE_ROUTE}
              flag={swapsEnabled}
              path={BUILD_QUOTE_ROUTE}
              exact
              render={() => {
                if (tradeTxData && !conversionError) {
                  return <Redirect to={{ pathname: AWAITING_SWAP_ROUTE }} />
                } else if (tradeTxData) {
                  return <Redirect to={{ pathname: SWAPS_ERROR_ROUTE }} />
                } else if (routeState === 'loading' && aggregatorMetadata) {
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
                    selectedAccountAddress={selectedAccountAddress}
                    maxSlippage={maxSlippage}
                  />
                )
              }}
            />
            <FeatureToggledRoute
              redirectRoute={SWAPS_MAINTENANCE_ROUTE}
              flag={swapsEnabled}
              path={VIEW_QUOTE_ROUTE}
              exact
              render={() => {
                if (Object.values(quotes).length) {
                  return (
                    <ViewQuote
                      numberOfQuotes={Object.values(quotes).length}
                    />
                  )
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
                      swapComplete={false}
                      errorKey={swapsErrorKey}
                      symbol={destinationTokenInfo?.symbol}
                      txHash={tradeTxData?.hash}
                      networkId={networkId}
                      rpcPrefs={rpcPrefs}
                      inputValue={inputValue}
                      maxSlippage={maxSlippage}
                      submittedTime={tradeTxData?.submittedTime}
                    />
                  )
                }
                return <Redirect to={{ pathname: BUILD_QUOTE_ROUTE }} />

              }}
            />
            <FeatureToggledRoute
              redirectRoute={SWAPS_MAINTENANCE_ROUTE}
              flag={swapsEnabled}
              path={LOADING_QUOTES_ROUTE}
              exact
              render={() => {
                return aggregatorMetadata
                  ? (
                    <LoadingQuote
                      loadingComplete={!fetchingQuotes && Boolean(Object.values(quotes).length)}
                      onDone={async () => {
                        await dispatch(setBackgroundSwapRouteState(''))

                        if (swapsErrorKey === ERROR_FETCHING_QUOTES || swapsErrorKey === QUOTES_NOT_AVAILABLE_ERROR) {
                          dispatch(setSwapsErrorKey(QUOTES_NOT_AVAILABLE_ERROR))
                          history.push(SWAPS_ERROR_ROUTE)
                        } else {
                          history.push(VIEW_QUOTE_ROUTE)
                        }
                      }}
                      aggregatorMetadata={aggregatorMetadata}
                    />
                  )
                  : <Redirect to={{ pathname: BUILD_QUOTE_ROUTE }} />
              }}
            />
            <Route
              path={SWAPS_MAINTENANCE_ROUTE}
              exact
              render={() => {
                return swapsEnabled === false ? (
                  <AwaitingSwap
                    errorKey={OFFLINE_FOR_MAINTENANCE}
                    symbol=""
                    networkId={networkId}
                    rpcPrefs={rpcPrefs}
                  />
                ) : <Redirect to={{ pathname: BUILD_QUOTE_ROUTE }} />
              }}
            />
            <Route
              path={AWAITING_SWAP_ROUTE}
              exact
              render={() => {
                return (routeState === 'awaiting') || tradeTxData
                  ? (
                    <AwaitingSwap
                      swapComplete={tradeConfirmed}
                      symbol={destinationTokenInfo?.symbol}
                      networkId={networkId}
                      txHash={tradeTxData?.hash}
                      tokensReceived={tokensReceived}
                      tradeTxData={tradeTxData}
                      usedGasPrice={usedGasPrice}
                      submittingSwap={routeState === 'awaiting' && !(approveTxId || tradeTxId)}
                      rpcPrefs={rpcPrefs}
                      inputValue={inputValue}
                      maxSlippage={maxSlippage}
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
