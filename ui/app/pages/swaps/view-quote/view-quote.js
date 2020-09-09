import React, { useState, useContext, useMemo, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useSelector, useDispatch } from 'react-redux'
import { useHistory } from 'react-router-dom'
import BigNumber from 'bignumber.js'
import { isEqual } from 'lodash'
import { I18nContext } from '../../../contexts/i18n'
import SelectQuotePopover from '../select-quote-popover'

import FeeCard from '../fee-card'
import { setCustomGasLimit } from '../../../ducks/gas/gas.duck'
import { getQuotes, getSelectedQuote, getApproveTxParams, getFetchParams, setBalanceError, getQuotesLastFetched, getBalanceError, getMaxMode, getCustomSwapsGas, getSwapsTradeTxParams } from '../../../ducks/swaps/swaps'
import { conversionRateSelector, getSelectedAccount, getCurrentCurrency, getTokenExchangeRates } from '../../../selectors'
import { toPrecisionWithoutTrailingZeros } from '../../../helpers/utils/util'
import { getTokens } from '../../../ducks/metamask/metamask'
import { safeRefetchQuotes, setSwapsTxGasLimit, setSelectedQuoteAggId, setSwapsErrorKey } from '../../../store/actions'
import {
  BUILD_QUOTE_ROUTE,
  SWAPS_ERROR_ROUTE,
} from '../../../helpers/constants/routes'

import {
  calcTokenAmount,
  calcTokenValue,
} from '../../../helpers/utils/token-util'
import { decimalToHex } from '../../../helpers/utils/conversions.util'
import MainQuoteSummary from '../main-quote-summary'
import { calcGasTotal } from '../../send/send.utils'
import ActionableMessage from '../actionable-message'
import { quotesToRenderableData, getRenderableGasFeesForQuote } from '../swaps.util'
import { useTokenTracker } from '../../../hooks/useTokenTracker'
import {
  ETH_SWAPS_TOKEN_OBJECT,
  QUOTES_EXPIRED_ERROR,
} from '../../../helpers/constants/swaps'
import CountdownTimer from '../countdown-timer'
import SwapsFooter from '../swaps-footer'

export default function ViewQuote ({ onSubmit, onCancel }) {
  const history = useHistory()
  const dispatch = useDispatch()
  const t = useContext(I18nContext)

  const _quotes = useSelector(getQuotes)
  if (!Object.values(_quotes).length) {
    history.push(BUILD_QUOTE_ROUTE)
  }

  const quotesLastFetched = useSelector(getQuotesLastFetched)

  // If the time since quotes were last fetched is greater than the desired time limit, make one attempt to refetch, otherwise treat quotes as expired and go to the error page
  const currentTime = Date.now()
  const timeSinceLastFetched = currentTime - quotesLastFetched
  const [dispatchedSafeRefetch, setDispatchedSafeRefetch] = useState(false)
  const quotesExpired = false
  if (timeSinceLastFetched > 60000 && !dispatchedSafeRefetch) {
    setDispatchedSafeRefetch(true)
    dispatch(safeRefetchQuotes())
  } else if (timeSinceLastFetched > 60000) {
    dispatch(setSwapsErrorKey(QUOTES_EXPIRED_ERROR))
    history.push(SWAPS_ERROR_ROUTE)
  }

  // Select necessary data
  const tradeTxParams = useSelector(getSwapsTradeTxParams)
  const { gasPrice } = tradeTxParams || {}
  const customMaxGas = useSelector(getCustomSwapsGas)
  const tokenConversionRates = useSelector(getTokenExchangeRates)
  const { balance: ethBalance } = useSelector(getSelectedAccount)
  const conversionRate = useSelector(conversionRateSelector)
  const currentCurrency = useSelector(getCurrentCurrency)
  const swapsTokens = useSelector(getTokens)
  const balanceError = useSelector(getBalanceError)
  const maxMode = useSelector(getMaxMode)

  const usedQuote = useSelector(getSelectedQuote)
  const usedGasLimit = usedQuote?.gasEstimate || (`0x${decimalToHex(usedQuote?.averageGas || 0)}`)
  const maxGasLimit = customMaxGas || (`0x${decimalToHex(usedQuote?.maxGas || 0)}`)
  const gasTotalInWeiHex = calcGasTotal(usedGasLimit, gasPrice)

  const fetchParams = useSelector(getFetchParams)
  const fetchParamsSourceToken = fetchParams?.sourceToken

  const { tokensWithBalances } = useTokenTracker(swapsTokens)
  const balanceToken = fetchParamsSourceToken === ETH_SWAPS_TOKEN_OBJECT.address
    ? { ...ETH_SWAPS_TOKEN_OBJECT, balance: ethBalance }
    : tokensWithBalances.find(({ address }) => address === fetchParamsSourceToken)

  const selectedFromToken = balanceToken || usedQuote.sourceTokenInfo
  const tokenBalance = tokensWithBalances?.length && calcTokenAmount(selectedFromToken.balance || '0x0', selectedFromToken.decimals).toFixed(9)

  const approveTxParams = useSelector(getApproveTxParams)
  const approveGas = approveTxParams?.gas

  // Manage fee and balance data
  const { feeinFiat, feeInEth } = getRenderableGasFeesForQuote(usedGasLimit, approveGas, gasPrice, currentCurrency, conversionRate)
  const { feeinFiat: maxFeeInFiat, feeInEth: maxFeeInEth } = getRenderableGasFeesForQuote(maxGasLimit, approveGas, gasPrice, currentCurrency, conversionRate)

  const tokenCost = (new BigNumber(usedQuote.sourceAmount))
  const ethCost = (new BigNumber(usedQuote.trade.value || 0, 10)).plus((new BigNumber(gasTotalInWeiHex, 16)))

  const insufficientTokens = (tokensWithBalances?.length || balanceError) && (tokenCost).gt(new BigNumber(selectedFromToken.balance || '0x0'))
  const insufficientEth = (ethCost).gt(new BigNumber(ethBalance || '0x0'))
  const tokenBalanceNeeded = insufficientTokens
    ? toPrecisionWithoutTrailingZeros(calcTokenAmount(tokenCost, selectedFromToken.decimals).minus(tokenBalance).toString(10), 6)
    : null
  const ethBalanceNeeded = insufficientEth
    ? toPrecisionWithoutTrailingZeros(ethCost.minus(ethBalance, 16).div('1000000000000000000', 10).toString(10), 6)
    : null
  useEffect(() => {
    if (insufficientTokens || insufficientEth) {
      dispatch(setBalanceError(true))
    } else if (balanceError && !insufficientTokens && !insufficientEth) {
      dispatch(setBalanceError(false))
    }
  }, [insufficientTokens, insufficientEth, balanceError, dispatch])

  // Memoize value
  const [quotes, setLocalQuotes] = useState(_quotes)
  useEffect(() => {
    if (!isEqual(quotes, _quotes)) {
      setLocalQuotes(_quotes)
    }
  }, [_quotes, quotes])

  const [memoizedTokenConversionRates, setMemoizedTokenConversionRates] = useState(tokenConversionRates)
  useEffect(() => {
    if (!isEqual(tokenConversionRates, memoizedTokenConversionRates)) {
      setMemoizedTokenConversionRates(tokenConversionRates)
    }
  }, [memoizedTokenConversionRates, tokenConversionRates])

  // Get renderable data for popover and main quote details component
  const renderablePopoverData = useMemo(() => {
    return quotesToRenderableData(quotes, gasPrice, conversionRate, currentCurrency, approveGas, memoizedTokenConversionRates)
  }, [quotes, gasPrice, conversionRate, currentCurrency, approveGas, memoizedTokenConversionRates])
  const renderableDataForUsedQuote = renderablePopoverData.find((renderablePopoverDatum) => renderablePopoverDatum.aggId === usedQuote.aggregator)

  const {
    destinationTokenDecimals,
    destinationTokenSymbol,
    destinationTokenValue,
    sourceTokenDecimals,
    sourceTokenSymbol,
    sourceTokenValue,
    isBestQuote,
  } = renderableDataForUsedQuote

  // set local state
  const [selectQuotePopoverShown, setSelectQuotePopoverShown] = useState(false)
  const [warningHidden, setWarningHidden] = useState(false)

  return (
    <div className="view-quote">
      <div className="view-quote__content">
        {selectQuotePopoverShown && (
          <SelectQuotePopover
            quoteDataRows={renderablePopoverData}
            onClose={() => setSelectQuotePopoverShown(false)}
            onSubmit={(aggId) => {
              dispatch(setSelectedQuoteAggId(aggId))
              dispatch(setCustomGasLimit(null))
              dispatch(setSwapsTxGasLimit(''))
            }}
            convertToSymbol={destinationTokenSymbol}
            initialAggId={usedQuote.aggregator}
          />
        )}
        <div className="view-quote__insufficient-eth-warning-wrapper">
          {((balanceError || tokenBalanceNeeded || ethBalanceNeeded) && !warningHidden && !(maxMode && sourceTokenSymbol === 'ETH')) && (
            <ActionableMessage
              message={t('swapApproveNeedMoreTokens', [<span key="swapApproveNeedMoreTokens-1" className="view-quote__bold">{tokenBalanceNeeded || ethBalanceNeeded}</span>, tokenBalanceNeeded && !(sourceTokenSymbol === 'ETH') ? sourceTokenSymbol : 'ETH'])}
              onClose={() => setWarningHidden(true)}
            />
          )}
        </div>
        {!quotesExpired && (
          <CountdownTimer
            timeStarted={quotesLastFetched}
            warningTime="0:30"
            infoTooltipLabelKey="swapQuotesAreRefreshed"
            labelKey="swapNewQuoteIn"
          />
        )}
        <MainQuoteSummary
          sourceValue={calcTokenValue(sourceTokenValue, sourceTokenDecimals)}
          sourceDecimals={sourceTokenDecimals}
          sourceSymbol={sourceTokenSymbol}
          destinationValue={calcTokenValue(destinationTokenValue, destinationTokenDecimals)}
          destinationDecimals={destinationTokenDecimals}
          destinationSymbol={destinationTokenSymbol}
          isBestQuote={isBestQuote}
          thin={(balanceError && !warningHidden)}
        />
        <div
          className="view-quote__view-other-button-container"
        >
          <div className="view-quote__view-other-button">{t('swapNQuotesAvailable', [quotes.length])}<i className="fa fa-arrow-right" /></div>
          <div
            className="view-quote__view-other-button-fade"
            onClick={() => {
              setSelectQuotePopoverShown(true)
            }}
          >{t('swapNQuotesAvailable', [quotes.length])}<i className="fa fa-arrow-right" />
          </div>
        </div>
        <FeeCard
          secondaryFee={feeinFiat}
          primaryFee={feeInEth}
          secondaryMaxFee={maxFeeInFiat}
          primaryMaxFee={maxFeeInEth}
          feeRowText={t('swapEstimatedNetworkFees')}
          maxFeeRowText={t('swapMaxNetworkFees')}
          maxFeeRowLinkText={t('edit')}
          maxFeeRowInfoTooltipText={t('swapMaxNetworkFeeInfo')}
          thirdRowText={t('swapThisWillAllowApprove', [<span key="swaps-view-quote-approve-symbol-1" className="view-quote__bold">{sourceTokenSymbol}</span>])}
          thirdRowLinkText={t('swapEditLimit')}
          hideThirdRow={!approveTxParams || (balanceError && !warningHidden)}
          thirdRowInfoTooltipText={t('swapEnableDescription', [sourceTokenSymbol])}
        />
      </div>
      <SwapsFooter
        onSubmit={onSubmit}
        submitText={t('swap')}
        onCancel={onCancel}
        disabled={!(maxMode && sourceTokenSymbol === 'ETH')}
        showTermsOfService
        showTopBorder
      />
    </div>
  )
}

ViewQuote.propTypes = {
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func,
}
