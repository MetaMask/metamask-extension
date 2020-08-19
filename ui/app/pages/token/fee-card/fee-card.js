import React from 'react'
import PropTypes from 'prop-types'

export default function FeeCard ({
  onFeeRowClick = null,
  feeRowText,
  feeRowLinkText = '',
  primaryFee,
  secondaryFee = '',
  onSecondRowClick = null,
  secondRowText = '',
  secondRowLinkText = '',
  hideSecondRow = false,
}) {
  return (
    <div className="fee-card">
      <div className="fee-card__main">
        <div className="fee-card__row-header" onClick={() => onFeeRowClick && onFeeRowClick()}>
          <div>
            <div className="fee-card__row-header-text">
              {feeRowText}
            </div>
            {onFeeRowClick && (
              <div className="fee-card__link">
                {feeRowLinkText}
              </div>
            )}
          </div>
          <div>
            <div className="fee-card__row-header-secondary">
              {primaryFee}
            </div>
            {secondaryFee && (
              <div className="fee-card__row-header-primary">
                {secondaryFee}
              </div>
            )}
          </div>
        </div>
        {!hideSecondRow && secondRowText && (
          <div className="fee-card__row">
            <div className="fee-card__row-label">
              <div className="fee-card__row-text">
                {secondRowText}
              </div>
              {secondRowLinkText && (
                <div className="fee-card__link" onClick={() => onSecondRowClick && onSecondRowClick()}>
                  {secondRowLinkText}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

FeeCard.propTypes = {
  onFeeRowClick: PropTypes.func,
  feeRowText: PropTypes.string.isRequired,
  feeRowLinkText: PropTypes.string,
  primaryFee: PropTypes.string.isRequired,
  secondaryFee: PropTypes.string,
  onSecondRowClick: PropTypes.func,
  secondRowText: PropTypes.string,
  secondRowLinkText: PropTypes.string,
  hideSecondRow: PropTypes.bool,
}
