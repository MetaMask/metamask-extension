import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import BigNumber from 'bignumber.js'
import classnames from 'classnames'
import { I18nContext } from '../../../../contexts/i18n'
import InfoTooltip from '../../../../components/ui/info-tooltip'
import { decEthToConvertedCurrency } from '../../../../helpers/utils/conversions.util'
import { formatCurrency } from '../../../../helpers/utils/confirm-tx.util'

function formatSavings (value, currentCurrency, conversionRate) {
  return formatCurrency(decEthToConvertedCurrency(
    value,
    currentCurrency,
    conversionRate,
  ), currentCurrency)
}

export default function SavingsTooltip ({
  savings,
  conversionRate,
  currentCurrency,
  tokenConversionRate,
  tokenSymbol,
}) {
  const t = useContext(I18nContext)

  const tokenSavings = (new BigNumber(savings.performance)).div(tokenConversionRate, 10).round(6).toString(10)
  const tokenSavingsIsPositive = (new BigNumber(savings.performance)).gt(0)
  const tokenSavingsInFiat = formatSavings(savings.performance, currentCurrency, conversionRate)

  const feeSavingsInFiat = formatSavings(savings.fee, currentCurrency, conversionRate)
  const feeSavingsIsPositive = (new BigNumber(savings.fee)).gt(0)

  const negativeSavingsMetaMaskFee = (new BigNumber(savings.metaMaskFee, 10)).times(-1, 10)
  const metaMaskFeeInFiat = formatSavings(negativeSavingsMetaMaskFee, currentCurrency, conversionRate)
  const metaMaskFeeInTokens = (new BigNumber(savings.metaMaskFee)).div(tokenConversionRate, 10).round(6).toString(10)

  const totalSavingsInFiat = formatSavings(savings.total, currentCurrency, conversionRate)
  const totalSavingsIsPositive = (new BigNumber(savings.total)).gt(0)

  let tokenSavingsText
  if (tokenSavingsIsPositive) {
    tokenSavingsText = t('swapReceivingNMoreTokens', [
      <span key="tokenSavings-1" className="fee-card__bold">{ tokenSavings }</span>,
      <span key="tokenSavings-2" className="fee-card__bold">{ tokenSymbol }</span>,
    ])
  } else {
    tokenSavingsText = t('swapReceivingNLessTokens', [
      <span key="tokenSavings-3" className="fee-card__bold">{ tokenSavings }</span>,
      <span key="tokenSavings-4" className="fee-card__bold">{ tokenSymbol }</span>,
    ])
  }

  let feeSavingsText
  if (feeSavingsIsPositive) {
    feeSavingsText = t('swapSavingOnGas', [
      <span key="feeSavingsText-1" className="fee-card__bold">{ savings.fee }</span>,
    ])
  } else {
    feeSavingsText = t('swapLosingOnGas', [
      <span key="feeSavingsText-2" className="fee-card__bold">{ savings.fee }</span>,
    ])
  }

  return (
    <InfoTooltip
      position="top"
      contentText={(
        <div className="fee-card__savings-tooltip">
          <div className="fee-card__savings-tooltip-row">
            <span className="fee-card__savings-tooltip-row-text">{ tokenSavingsText }</span>
            <span
              className={classnames('fee-card__savings-tooltip-number', {
                'fee-card__savings-tooltip-number--green': tokenSavingsIsPositive,
                'fee-card__savings-tooltip-number--grey': !tokenSavingsIsPositive,
              })}
            >
              { tokenSavingsIsPositive
                ? t('positiveSign', [tokenSavingsInFiat])
                : tokenSavingsInFiat
              }
            </span>
          </div>
          <div className="fee-card__savings-tooltip-row">
            <span className="fee-card__savings-tooltip-row-text">{ feeSavingsText }</span>
            <span
              className={classnames('fee-card__savings-tooltip-number', {
                'fee-card__savings-tooltip-number--green': feeSavingsIsPositive,
                'fee-card__savings-tooltip-number--grey': !feeSavingsIsPositive,
              })}
            >
              { feeSavingsIsPositive
                ? t('positiveSign', [feeSavingsInFiat])
                : feeSavingsInFiat
              }
            </span>
          </div>
          <div className="fee-card__savings-tooltip-row">
            <span className="fee-card__savings-tooltip-row-text">{ t('swapMetaMaskFeeWithRate', [
              <span key="metaMaskFee-1" className="fee-card__bold">{ metaMaskFeeInTokens }</span>,
              <span key="metaMaskFee-2" className="fee-card__bold">{ tokenSymbol }</span>,
            ]) }
            </span>
            <span
              className={classnames('fee-card__savings-tooltip-number--grey')}
            >
              { metaMaskFeeInFiat }
            </span>
          </div>
          <div className="fee-card__savings-tooltip-total-row">
            <span className="fee-card__savings-tooltip-total-row-text">{ t('swapAverageSavings') }</span>
            <span
              className={classnames('fee-card__savings-tooltip-number', {
                'fee-card__savings-tooltip-number--green': totalSavingsIsPositive,
                'fee-card__savings-tooltip-number--grey': !totalSavingsIsPositive,
              })}
            >
              { totalSavingsIsPositive
                ? t('positiveSign', [totalSavingsInFiat])
                : totalSavingsInFiat
              }
            </span>
          </div>
          <p className="fee-card__savings-tooltip-description">
            { t('swapSavingDescription') }
          </p>
        </div>
      )
      }
      containerClassName="fee-card__savings-info-tooltip-container"
      color="#037DD6"
      theme="extraWide"
    />
  )
}

SavingsTooltip.propTypes = {
  savings: PropTypes.object,
  conversionRate: PropTypes.number,
  currentCurrency: PropTypes.string,
  tokenConversionRate: PropTypes.number,
  tokenSymbol: PropTypes.string,
}
