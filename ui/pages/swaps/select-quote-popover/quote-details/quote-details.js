import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { I18nContext } from '../../../../contexts/i18n';
import InfoTooltip from '../../../../components/ui/info-tooltip';
import ExchangeRateDisplay from '../../exchange-rate-display';
import { getUseCurrencyRateCheck } from '../../../../selectors';

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
  metaMaskFee,
  hideEstimatedGasFee,
}) => {
  const t = useContext(I18nContext);
  const useCurrencyRateCheck = useSelector(getUseCurrencyRateCheck);

  return (
    <div className="quote-details">
      <div className="quote-details__row">
        <div className="quote-details__detail-header">{t('swapRate')}</div>
        <div className="quote-details__detail-content">
          <ExchangeRateDisplay
            primaryTokenValue={sourceTokenValue}
            primaryTokenDecimals={1}
            primaryTokenSymbol={sourceTokenSymbol}
            secondaryTokenValue={destinationTokenValue}
            secondaryTokenDecimals={1}
            secondaryTokenSymbol={destinationTokenSymbol}
          />
        </div>
      </div>
      <div className="quote-details__row">
        <div className="quote-details__detail-header">
          {t('swapMaxSlippage')}
          <InfoTooltip
            position="bottom"
            contentText={t('swapSlippageTooltip')}
          />
        </div>
        <div className="quote-details__detail-content">{`${slippage}%`}</div>
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
          <span>{minimumAmountReceived}</span>
          <span className="quote-details__bold">{` ${destinationTokenSymbol}`}</span>
        </div>
      </div>
      {!hideEstimatedGasFee && (
        <div className="quote-details__row">
          <div className="quote-details__detail-header">
            {t('swapEstimatedNetworkFees')}
            <InfoTooltip
              position="bottom"
              contentText={t('swapEstimatedNetworkFeesInfo')}
            />
          </div>
          <div className="quote-details__detail-content">
            <span>{feeInEth}</span>
            <span className="quote-details__light-grey">
              {useCurrencyRateCheck && ` (${networkFees})`}
            </span>
          </div>
        </div>
      )}
      <div className="quote-details__row">
        <div className="quote-details__detail-header">
          {t('swapSource')}
          <InfoTooltip
            position="bottom"
            contentText={t('swapLiquiditySourceInfo')}
          />
        </div>
        <div className="quote-details__detail-content">
          {t(liquiditySourceKey)}
        </div>
      </div>
      <div className="quote-details__row quote-details__row--high">
        <div className="quote-details__detail-header">
          <img
            src="./images/logo/metamask-fox.svg"
            className="quote-details__metafox-logo"
            alt=""
          />
          {t('swapMetaMaskFee')}
        </div>
        <div className="quote-details__detail-content">
          {t('swapMetaMaskFeeDescription', [metaMaskFee])}
        </div>
      </div>
    </div>
  );
};

QuoteDetails.propTypes = {
  slippage: PropTypes.number.isRequired,
  sourceTokenValue: PropTypes.string.isRequired,
  sourceTokenSymbol: PropTypes.string.isRequired,
  destinationTokenValue: PropTypes.string.isRequired,
  destinationTokenSymbol: PropTypes.string.isRequired,
  liquiditySourceKey: PropTypes.string.isRequired,
  minimumAmountReceived: PropTypes.string.isRequired,
  feeInEth: PropTypes.string.isRequired,
  networkFees: PropTypes.string.isRequired,
  metaMaskFee: PropTypes.number.isRequired,
  hideEstimatedGasFee: PropTypes.bool,
};

export default QuoteDetails;
