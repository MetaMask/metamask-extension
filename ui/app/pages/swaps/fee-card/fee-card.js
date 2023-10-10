import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import BigNumber from 'bignumber.js'
import classnames from 'classnames'
import { I18nContext } from '../../../contexts/i18n'
import InfoTooltip from '../../../components/ui/info-tooltip'
import { decEthToConvertedCurrency } from '../../../helpers/utils/conversions.util'
import { formatCurrency } from '../../../helpers/utils/confirm-tx.util'
import PigIcon from './pig-icon'

export default function FeeCard({
  primaryFee,
  secondaryFee,
  hideTokenApprovalRow,
  onFeeCardMaxRowClick,
  tokenApprovalTextComponent,
  tokenApprovalSourceTokenSymbol,
  onTokenApprovalClick,
  metaMaskFee,
  savings,
  isBestQuote,
  numberOfQuotes,
  onQuotesClick,
  conversionRate,
  currentCurrency,
  tokenConversionRate,
}) {
  const t = useContext(I18nContext)

  const savingAmount =
    isBestQuote && savings?.total
      ? formatCurrency(
          decEthToConvertedCurrency(
            savings.total,
            currentCurrency,
            conversionRate,
          ),
          currentCurrency,
        )
      : null
  const savingsIsPositive =
    savings?.total && new BigNumber(savings.total, 10).gt(0)

  const inDevelopment = process.env.NODE_ENV === 'development'
  const shouldDisplaySavings =
    inDevelopment && isBestQuote && tokenConversionRate && savingsIsPositive

  let savingsText = ''
  if (inDevelopment && shouldDisplaySavings) {
    savingsText = t('swapSaving', [
      <span key="savings-tilde" className="fee-card__tilde">
        ~
      </span>,
      savingAmount,
    ])
  } else if (inDevelopment && isBestQuote && tokenConversionRate) {
    savingsText = t('swapUsingBestQuote')
  } else if (inDevelopment && savingsIsPositive && tokenConversionRate) {
    savingsText = t('swapBetterQuoteAvailable')
  }

  return (
    <div className="fee-card">
      <div className="fee-card__savings-and-quotes-header">
        <div className="fee-card__savings-and-quotes-header-first-part" />
        <div
          className={classnames(
            'fee-card__savings-and-quotes-header-second-part',
            {
              'fee-card__savings-and-quotes-header-second-part--top-border': !shouldDisplaySavings,
            },
          )}
        />
        <div className="fee-card__savings-and-quotes-header-third-part" />
        {shouldDisplaySavings && (
          <div className="fee-card__pig-icon-container">
            <PigIcon />
          </div>
        )}
        <div
          className={classnames('fee-card__savings-and-quotes-row', {
            'fee-card__savings-and-quotes-row--align-left': !shouldDisplaySavings,
          })}
        >
          {savingsText && (
            <p className="fee-card__savings-text">{savingsText}</p>
          )}
          <div
            className="fee-card__quote-link-container"
            onClick={onQuotesClick}
          >
            <p className="fee-card__quote-link-text">
              {t('swapNQuotes', [numberOfQuotes])}
            </p>
            <div className="fee-card__caret-right">
              <i className="fa fa-angle-up" />
            </div>
          </div>
        </div>
      </div>
      <div className="fee-card__main">
        <div className="fee-card__row-header">
          <div>
            <div className="fee-card__row-header-text--bold">
              {t('swapEstimatedNetworkFee')}
            </div>
            <InfoTooltip
              position="top"
              contentText={
                <>
                  <p className="fee-card__info-tooltip-paragraph">
                    {t('swapNetworkFeeSummary')}
                  </p>
                  <p className="fee-card__info-tooltip-paragraph">
                    {t('swapEstimatedNetworkFeeSummary', [
                      <span className="fee-card__bold" key="fee-card-bold-1">
                        {t('swapEstimatedNetworkFee')}
                      </span>,
                    ])}
                  </p>
                  <p className="fee-card__info-tooltip-paragraph">
                    {t('swapMaxNetworkFeeInfo', [
                      <span className="fee-card__bold" key="fee-card-bold-2">
                        {t('swapMaxNetworkFees')}
                      </span>,
                    ])}
                  </p>
                </>
              }
              containerClassName="fee-card__info-tooltip-content-container"
              wrapperClassName="fee-card__row-label fee-card__info-tooltip-container"
              wide
            />
          </div>
          <div>
            <div className="fee-card__row-header-secondary--bold">
              {primaryFee.fee}
            </div>
            {secondaryFee && (
              <div className="fee-card__row-header-primary--bold">
                {secondaryFee.fee}
              </div>
            )}
          </div>
        </div>
        <div
          className="fee-card__row-header"
          onClick={() => onFeeCardMaxRowClick()}
        >
          <div>
            <div className="fee-card__row-header-text">
              {t('swapMaxNetworkFees')}
            </div>
            <div className="fee-card__link">{t('edit')}</div>
          </div>
          <div>
            <div className="fee-card__row-header-secondary">
              {primaryFee.maxFee}
            </div>
            {secondaryFee?.maxFee !== undefined && (
              <div className="fee-card__row-header-primary">
                {secondaryFee.maxFee}
              </div>
            )}
          </div>
        </div>
        {!hideTokenApprovalRow && (
          <div className="fee-card__row-header">
            <div className="fee-card__row-label">
              <div className="fee-card__row-header-text">
                {t('swapThisWillAllowApprove', [tokenApprovalTextComponent])}
              </div>
              <InfoTooltip
                position="top"
                contentText={t('swapEnableDescription', [
                  tokenApprovalSourceTokenSymbol,
                ])}
                containerClassName="fee-card__info-tooltip-container"
              />
            </div>
            <div
              className="fee-card__link"
              onClick={() => onTokenApprovalClick()}
            >
              {t('swapEditLimit')}
            </div>
          </div>
        )}
        <div className="fee-card__top-bordered-row">
          <div className="fee-card__row-label">
            <div className="fee-card__row-header-text">
              {t('swapQuoteIncludesRate', [metaMaskFee])}
            </div>
            <InfoTooltip
              position="top"
              contentText={t('swapMetaMaskFeeDescription', [metaMaskFee])}
              wrapperClassName="fee-card__info-tooltip-container"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

FeeCard.propTypes = {
  primaryFee: PropTypes.shape({
    fee: PropTypes.string.isRequired,
    maxFee: PropTypes.string.isRequired,
  }).isRequired,
  secondaryFee: PropTypes.shape({
    fee: PropTypes.string.isRequired,
    maxFee: PropTypes.string.isRequired,
  }),
  onFeeCardMaxRowClick: PropTypes.func.isRequired,
  hideTokenApprovalRow: PropTypes.bool.isRequired,
  tokenApprovalTextComponent: PropTypes.node,
  tokenApprovalSourceTokenSymbol: PropTypes.string,
  onTokenApprovalClick: PropTypes.func,
  metaMaskFee: PropTypes.string.isRequired,
  savings: PropTypes.object,
  isBestQuote: PropTypes.bool,
  onQuotesClick: PropTypes.func.isRequired,
  numberOfQuotes: PropTypes.number.isRequired,
  conversionRate: PropTypes.number,
  currentCurrency: PropTypes.string,
  tokenConversionRate: PropTypes.number,
}
