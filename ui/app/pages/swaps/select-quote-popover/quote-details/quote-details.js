import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { I18nContext } from '../../../../contexts/i18n'
import InfoTooltip from '../../../../components/ui/info-tooltip'
import ExchangeRateDisplay from '../../exchange-rate-display'

const QuoteDetails = ({
  metaMaskFee,
  slippage,
  amountReceiving,
  networkFees,
  sourceTokenValue,
  sourceTokenDecimals,
  sourceTokenSymbol,
  destinationTokenValue,
  destinationTokenDecimals,
  destinationTokenSymbol,
  liquiditySource,
}) => {
  const t = useContext(I18nContext)
  return (
    <div className="quote-details">
      <div className="quote-details__row">
        <div className="quote-details__detail-header">{t('swapRate')}</div>
        <div className="quote-details__detail-content">
          <ExchangeRateDisplay
            primaryTokenValue={ sourceTokenValue }
            primaryTokenDecimals={ sourceTokenDecimals }
            primaryTokenSymbol={ sourceTokenSymbol }
            secondaryTokenValue={ destinationTokenValue }
            secondaryTokenDecimals={ destinationTokenDecimals }
            secondaryTokenSymbol={ destinationTokenSymbol }
          />
        </div>
      </div>
      <div className="quote-details__row">
        <div className="quote-details__detail-header">
          <img src="/images/logo/metamask-fox.svg" className="quote-details__metafox-logo" />
          {t('swapMetaMaskFee')}
          <InfoTooltip
            position="bottom"
            contentText={t('swapMetaMaskFeeInfo')}
          />
        </div>
        <div className="quote-details__detail-content">
          {metaMaskFee}
        </div>
      </div>
      <div className="quote-details__row">
        <div className="quote-details__detail-header">
          {t('swapMaxSlippage')}
          <InfoTooltip
            position="bottom"
            contentText={t('swapQuoteDetailsSlippageInfo')}
          />
        </div>
        <div className="quote-details__detail-content">
          {`${slippage}%`}
        </div>
      </div>
      <div className="quote-details__row">
        <div className="quote-details__detail-header">
          {t('swapAmountReceived')}
          <InfoTooltip
            position="bottom"
            contentText={t('swapAmountReceivedInfo')}
          />
        </div>
        <div className="quote-details__detail-content">
          {amountReceiving}
        </div>
      </div>
      <div className="quote-details__row">
        <div className="quote-details__detail-header">
          {t('swapNetworkFees')}
          <InfoTooltip
            position="bottom"
            contentText={t('swapNetworkFeesInfo')}
          />
        </div>
        <div className="quote-details__detail-content">
          {networkFees}
        </div>
      </div>
      <div className="quote-details__row">
        <div className="quote-details__detail-header">
          {t('swapSource')}
          <InfoTooltip
            position="bottom"
            contentText={t('swapSourceInfo')}
          />
        </div>
        <div className="quote-details__detail-content">
          {liquiditySource}
        </div>
      </div>
    </div>
  )
}

QuoteDetails.propTypes = {
  metaMaskFee: PropTypes.string.isRequired,
  slippage: PropTypes.string.isRequired,
  amountReceiving: PropTypes.string.isRequired,
  networkFees: PropTypes.string.isRequired,
  sourceTokenValue: PropTypes.string.isRequired,
  sourceTokenDecimals: PropTypes.number.isRequired,
  sourceTokenSymbol: PropTypes.string.isRequired,
  destinationTokenValue: PropTypes.string.isRequired,
  destinationTokenDecimals: PropTypes.number.isRequired,
  destinationTokenSymbol: PropTypes.string.isRequired,
  liquiditySource: PropTypes.string.isRequired,
}

export default QuoteDetails
