import React, { useContext } from 'react'

import PropTypes from 'prop-types'
import classnames from 'classnames'
import BigNumber from 'bignumber.js'
import { useEthFiatAmount } from '../../../hooks/useEthFiatAmount'
import { I18nContext } from '../../../contexts/i18n'

import ActionableMessage from '../actionable-message'
import Tooltip from '../../../components/ui/tooltip'

export default function ViewQuotePriceDifference(props) {
  const { usedQuote, sourceTokenValue, destinationTokenValue } = props

  const t = useContext(I18nContext)

  const priceSlippageFromSource = useEthFiatAmount(
    usedQuote?.priceSlippage?.sourceAmountInETH || 0,
  )
  const priceSlippageFromDestination = useEthFiatAmount(
    usedQuote?.priceSlippage?.destinationAmountInEth || 0,
  )

  if (!usedQuote || !usedQuote.priceSlippage) {
    return null
  }

  const { priceSlippage } = usedQuote

  // We cannot present fiat value if there is a calculation error or no slippage
  // from source or destination
  const priceSlippageUnknownFiatValue =
    !priceSlippageFromSource ||
    !priceSlippageFromDestination ||
    priceSlippage.calculationError

  let priceDifferencePercentage = 0
  if (priceSlippage.ratio) {
    priceDifferencePercentage = parseFloat(
      new BigNumber(priceSlippage.ratio, 10)
        .minus(1, 10)
        .times(100, 10)
        .toFixed(2),
      10,
    )
  }

  const shouldShowPriceDifferenceWarning =
    ['high', 'medium'].includes(priceSlippage.bucket) ||
    priceSlippageUnknownFiatValue

  if (!shouldShowPriceDifferenceWarning) {
    return null
  }

  let priceDifferenceTitle = ''
  let priceDifferenceMessage = ''
  let priceDifferenceClass = ''
  if (priceSlippageUnknownFiatValue) {
    // A calculation error signals we cannot determine dollar value
    priceDifferenceMessage = t('swapPriceDifferenceUnavailable')
    priceDifferenceClass = 'fiat-error'
  } else {
    priceDifferenceTitle = t('swapPriceDifferenceTitle', [
      priceDifferencePercentage,
    ])
    priceDifferenceMessage = t('swapPriceDifference', [
      sourceTokenValue, // Number of source token to swap
      usedQuote.sourceTokenInfo.symbol, // Source token symbol
      priceSlippageFromSource, // Source tokens total value
      destinationTokenValue, // Number of destination tokens in return
      usedQuote.destinationTokenInfo.symbol, // Destination token symbol,
      priceSlippageFromDestination, // Destination tokens total value
    ])
    priceDifferenceClass = priceSlippage.bucket
  }

  return (
    <div
      className={classnames(
        'view-quote__price-difference-warning-wrapper',
        priceDifferenceClass,
      )}
    >
      <ActionableMessage
        message={
          <div className="view-quote__price-difference-warning-contents">
            <div className="view-quote__price-difference-warning-contents-text">
              {priceDifferenceTitle && (
                <div className="view-quote__price-difference-warning-contents-title">
                  {priceDifferenceTitle}
                </div>
              )}
              {priceDifferenceMessage}
            </div>
            <Tooltip
              position="bottom"
              theme="white"
              title={t('swapPriceDifferenceTooltip')}
            >
              <i className="fa fa-info-circle" />
            </Tooltip>
          </div>
        }
      />
    </div>
  )
}

ViewQuotePriceDifference.propTypes = {
  usedQuote: PropTypes.object,
  sourceTokenValue: PropTypes.string,
  destinationTokenValue: PropTypes.string,
}
