import React, { useState, useEffect, useCallback, useRef, useContext } from 'react'
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
  getSubmittingSwap,
  setTopAssets,
  getTradeTxParams,
  getFetchParams,
  setAggregatorMetadata,
  getAggregatorMetadata,
  getBackgroundSwapRouteState,
  getSwapsErrorKey,
  setMetamaskFeeAmount,
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
  ERROR_FETCHING_QUOTES,
  QUOTES_NOT_AVAILABLE_ERROR,
  ETH_SWAPS_TOKEN_OBJECT,
  SWAP_FAILED_ERROR,
} from '../../helpers/constants/swaps'

import { fetchBasicGasAndTimeEstimates, fetchGasEstimates, resetCustomData } from '../../ducks/gas/gas.duck'
import { resetBackgroundSwapsState, setSwapsTokens, setSwapsTxGasPrice, setMaxMode, removeToken, setBackgroundSwapRouteState, setSwapsErrorKey } from '../../store/actions'
import { getAveragePriceEstimateInHexWEI, currentNetworkTxListSelector, getCustomNetworkId, getRpcPrefsForCurrentProvider } from '../../selectors'
import { decGWEIToHexWEI, getValueFromWeiHex } from '../../helpers/utils/conversions.util'

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

  const fetchParams = useSelector(getFetchParams)
  const { sourceTokenInfo = {}, destinationTokenInfo = {} } = fetchParams?.metaData || {}

  const [inputValue, setInputValue] = useState(fetchParams?.value || '')
  const [maxSlippage, setMaxSlippage] = useState(fetchParams?.slippage || 2)

  const submittingSwap = useSelector(getSubmittingSwap)
  const routeState = useSelector(getBackgroundSwapRouteState)
  const tradeTxParams = useSelector(getTradeTxParams)
  const selectedAccount = useSelector(getSelectedAccount)
  const quotes = useSelector(getQuotes)
  const averageGasEstimate = useSelector(getAveragePriceEstimateInHexWEI)
  const customConvertGasPrice = useSelector(getCustomSwapsGasPrice)
  const txList = useSelector(currentNetworkTxListSelector)
  const tradeTxId = useSelector(getTradeTxId)
  const approveTxId = useSelector(getApproveTxId)
  const aggregatorMetadata = useSelector(getAggregatorMetadata)
  const networkId = useSelector(getCurrentNetworkId)
  const customNetworkId = useSelector(getCustomNetworkId)
  const rpcPrefs = useSelector(getRpcPrefsForCurrentProvider)
  const fetchingQuotes = useSelector(getFetchingQuotes)
  let swapsErrorKey = useSelector(getSwapsErrorKey)

  const { balance: ethBalance, address: selectedAccountAddress } = selectedAccount
  const fetchParamsFromToken = sourceTokenInfo?.symbol === 'ETH'
    ? { ...ETH_SWAPS_TOKEN_OBJECT, string: getValueFromWeiHex({ value: ethBalance, numberOfDecimals: 4, toDenomination: 'ETH' }), balance: ethBalance }
    : sourceTokenInfo
  const selectedFromToken = useSelector(getFromToken) || fetchParamsFromToken || {}
  const { destinationTokenAddedForSwap } = fetchParams || {}

  const usedGasPrice = customConvertGasPrice || tradeTxParams?.gasPrice || averageGasEstimate
  const tradeTxParamsTo = tradeTxParams?.to
  const approveTxData = approveTxId && txList.find(({ id }) => approveTxId === id)
  const tradeTxData = tradeTxId && txList.find(({ id }) => tradeTxId === id)
  const tokensReceived = tradeTxData?.txReceipt && getSwapsTokensReceivedFromTxMeta(
    destinationTokenInfo?.symbol,
    tradeTxData,
    destinationTokenInfo?.address,
    selectedAccountAddress,
    destinationTokenInfo?.decimals,
  )
  const tradeConfirmed = tradeTxData?.status === 'confirmed'
  const approveError = approveTxData?.status === 'failed' || approveTxData?.txReceipt?.status === '0x0'
  const tradeError = tradeTxData?.status === 'failed' || tradeTxData?.txReceipt?.status === '0x0'
  const conversionError = approveError || tradeError
  const isCustomNetwork = Boolean(customNetworkId) || true

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

  const initialDataFetch = useCallback(() => {
    dispatch(fetchBasicGasAndTimeEstimates())
      .then((basicEstimates) => {
        if (tradeTxParamsTo || !customConvertGasPrice || customConvertGasPrice === '0x0') {
          dispatch(setSwapsTxGasPrice(decGWEIToHexWEI(basicEstimates.average)))
        }
        return basicEstimates.blockTime
      })
      .then((blockTime) => {
        dispatch(fetchGasEstimates(blockTime, true))
      })

  }, [dispatch, tradeTxParamsTo, customConvertGasPrice])

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

    fetchMetaMaskFeeAmount(isCustomNetwork)
      .then((metaMaskFeeAmount) => {
        dispatch(setMetamaskFeeAmount(metaMaskFeeAmount))
      })

    return () => {
      dispatch(resetCustomData())
      dispatch(clearSwapsState())
      dispatch(resetBackgroundSwapsState())
    }
  }, [dispatch, isCustomNetwork])

  useEffect(() => {
    if (swapsErrorKey && !isSwapsErrorRoute) {
      history.push(SWAPS_ERROR_ROUTE)
    }
  }, [history, swapsErrorKey, isSwapsErrorRoute])

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
              onClick={() => {
                dispatch(clearSwapsState())
                dispatch(resetBackgroundSwapsState())
                history.push(DEFAULT_ROUTE)
              }}
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
                    setMaxMode={setMaxMode}
                    selectedAccountAddress={selectedAccountAddress}
                    maxSlippage={maxSlippage}
                  />
                )
              }}
            />
            <Route
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
                      onCancel={onRetry}
                      submittedTime={tradeTxData?.submittedTime}
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
              path={AWAITING_SWAP_ROUTE}
              exact
              render={() => {
                return submittingSwap || tradeTxData
                  ? (
                    <AwaitingSwap
                      swapComplete={tradeConfirmed}
                      symbol={destinationTokenInfo?.symbol}
                      networkId={networkId}
                      txHash={tradeTxData?.hash}
                      tokensReceived={tokensReceived}
                      tradeTxData={tradeTxData}
                      usedGasPrice={usedGasPrice}
                      submittingSwap={submittingSwap}
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
