import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { I18nContext } from '../../../contexts/i18n'
import InfoTooltip from '../../../components/ui/info-tooltip'

export default function FeeCard ({
  primaryFee,
  secondaryFee,
  hideTokenApprovalRow,
  onFeeCardMaxRowClick,
  tokenApprovalTextComponent,
  tokenApprovalSourceTokenSymbol,
  onTokenApprovalClick,
}) {
  const t = useContext(I18nContext)

  return (
    <div className="fee-card">
      <div className="fee-card__main">
        <div className="fee-card__row-header">
          <div>
            <div className="fee-card__row-header-text--bold">
              {t('swapEstimatedNetworkFee')}
            </div>
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
        <div className="fee-card__row-header" onClick={() => onFeeCardMaxRowClick()}>
          <div>
            <div className="fee-card__row-header-text">
              {t('swapMaxNetworkFees')}
            </div>
            <div className="fee-card__link">
              {t('edit')}
            </div>
            <div className="fee-card__row-label">
              <InfoTooltip
                position="top"
                contentText={t('swapMaxNetworkFeeInfo')}
              />
            </div>
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
          <div className="fee-card__top-bordered-row">
            <div className="fee-card__row-label">
              <div className="fee-card__row-header-text">
                {t('swapThisWillAllowApprove', [tokenApprovalTextComponent])}
              </div>
              <div className="fee-card__link" onClick={() => onTokenApprovalClick()}>
                {t('swapEditLimit')}
              </div>
              <InfoTooltip
                position="top"
                contentText={t('swapEnableDescription', [tokenApprovalSourceTokenSymbol])}
              />
            </div>
          </div>
        )}
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
}
