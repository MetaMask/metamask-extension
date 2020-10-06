import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'
import { I18nContext } from '../../../../contexts/i18n'
import { getMetaMaskFeeAmount } from '../../../../ducks/swaps/swaps'
import InfoTooltip from '../../../../components/ui/info-tooltip'
import ExchangeRateDisplay from '../../exchange-rate-display'

const QuoteDetails = ({
  slippage,
  sourceTokenValue,
  sourceTokenSymbol,
  destinationTokenValue,
  destinationTokenSymbol,
  liquiditySourceKey,
  minimumAmountReceived,
  feeInEth,
  networkFees,
}) => {
  const t = useContext(I18nContext)
  const metaMaskFee = useSelector(getMetaMaskFeeAmount)
  return (
    <div className="quote-details">
      <div className="quote-details__row">
        <div className="quote-details__detail-header">{t('swapRate')}</div>
        <div className="quote-details__detail-content">
          <ExchangeRateDisplay
            primaryTokenValue={ sourceTokenValue }
            primaryTokenDecimals={ 1 }
            primaryTokenSymbol={ sourceTokenSymbol }
            secondaryTokenValue={ destinationTokenValue }
            secondaryTokenDecimals={ 1 }
            secondaryTokenSymbol={ destinationTokenSymbol }
          />
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
          <span>{minimumAmountReceived}</span><span className="quote-details__bold">{` ${destinationTokenSymbol}`}</span>
        </div>
      </div>
      <div className="quote-details__row">
        <div className="quote-details__detail-header">
          {t('swapEstimatedNetworkFees')}
          <InfoTooltip
            position="bottom"
            contentText={t('swapEstimatedNetworkFeesInfo')}
          />
        </div>
        <div className="quote-details__detail-content">
          <span>{feeInEth}</span><span className="quote-details__light-grey">{` (${networkFees})`}</span>
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
          {t(liquiditySourceKey)}
        </div>
      </div>
      <div className="quote-details__row quote-details__row--high">
        <div className="quote-details__detail-header">
          <img src="/images/logo/metamask-fox.svg" className="quote-details__metafox-logo" />
          {t('swapMetaMaskFee')}
        </div>
        <div className="quote-details__detail-content">
          {t('swapMetaMaskFeeDescription', [metaMaskFee])}
        </div>
      </div>
    </div>
  )
}

QuoteDetails.propTypes = {
  slippage: PropTypes.string.isRequired,
  sourceTokenValue: PropTypes.string.isRequired,
  sourceTokenSymbol: PropTypes.string.isRequired,
  destinationTokenValue: PropTypes.string.isRequired,
  destinationTokenSymbol: PropTypes.string.isRequired,
  liquiditySourceKey: PropTypes.string.isRequired,
  minimumAmountReceived: PropTypes.string.isRequired,
  feeInEth: PropTypes.string.isRequired,
  networkFees: PropTypes.string.isRequired,
}

export default QuoteDetails
