import React from 'react'
import PropTypes from 'prop-types'
import InfoTooltip from '../../../components/ui/info-tooltip'

export default function FeeCard ({
  feeRowText,
  primaryFee,
  secondaryFee,
  thirdRow,
  maxFeeRow,
}) {
  return (
    <div className="fee-card">
      <div className="fee-card__main">
        <div className="fee-card__row-header">
          <div>
            <div className="fee-card__row-header-text--bold">
              {feeRowText}
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
        <div className="fee-card__row-header" onClick={() => maxFeeRow.onClick()}>
          <div>
            <div className="fee-card__row-header-text">
              {maxFeeRow.text}
            </div>
            <div className="fee-card__link">
              {maxFeeRow.linkText}
            </div>
            <div className="fee-card__row-label">
              <InfoTooltip
                position="top"
                contentText={maxFeeRow.tooltipText}
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
        {thirdRow && !thirdRow.hide && (
          <div className="fee-card__top-bordered-row">
            <div className="fee-card__row-label">
              <div className="fee-card__row-header-text">
                {thirdRow.text}
              </div>
              <div className="fee-card__link" onClick={() => thirdRow.onClick()}>
                {thirdRow.linkText}
              </div>
              <InfoTooltip
                position="top"
                contentText={thirdRow.tooltipText}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

FeeCard.propTypes = {
  feeRowText: PropTypes.string.isRequired,
  primaryFee: PropTypes.shape({
    fee: PropTypes.string.isRequired,
    maxFee: PropTypes.string.isRequired,
  }).isRequired,
  secondaryFee: PropTypes.shape({
    fee: PropTypes.string.isRequired,
    maxFee: PropTypes.string.isRequired,
  }),
  maxFeeRow: PropTypes.shape({
    text: PropTypes.string.isRequired,
    linkText: PropTypes.string.isRequired,
    tooltipText: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
  }).isRequired,
  thirdRow: PropTypes.shape({
    text: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.node,
    ]).isRequired,
    linkText: PropTypes.string.isRequired,
    tooltipText: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.node,
    ]).isRequired,
    onClick: PropTypes.func.isRequired,
    hide: PropTypes.bool.isRequired,
  }),
}
