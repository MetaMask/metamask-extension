import React from 'react'
import PropTypes from 'prop-types'
import InfoTooltip from '../../../components/ui/info-tooltip'

export default function FeeCard ({
  feeRowText,
  primaryFee,
  secondaryFee,
  thirdRowText,
  thirdRowLinkText,
  hideThirdRow = false,
  onThirdRowClick,
  thirdRowInfoTooltipText,
  maxFeeRowInfoTooltipText,
  primaryMaxFee,
  secondaryMaxFee,
  maxFeeRowText,
  maxFeeRowLinkText,
  onMaxRowClick,
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
              {primaryFee}
            </div>
            {secondaryFee && (
              <div className="fee-card__row-header-primary--bold">
                {secondaryFee}
              </div>
            )}
          </div>
        </div>
        <div className="fee-card__row-header" onClick={() => onMaxRowClick && onMaxRowClick()}>
          <div>
            <div className="fee-card__row-header-text">
              {maxFeeRowText}
            </div>
            {onMaxRowClick && (
              <div className="fee-card__link">
                {maxFeeRowLinkText}
              </div>
            )}
            <div className="fee-card__row-label">
              <InfoTooltip
                position="top"
                contentText={maxFeeRowInfoTooltipText}
              />
            </div>
          </div>
          <div>
            <div className="fee-card__row-header-secondary">
              {primaryMaxFee}
            </div>
            {secondaryMaxFee && (
              <div className="fee-card__row-header-primary">
                {secondaryMaxFee}
              </div>
            )}
          </div>
        </div>
        {!hideThirdRow && thirdRowText && (
          <div className="fee-card__top-bordered-row">
            <div className="fee-card__row-label">
              <div className="fee-card__row-text">
                {thirdRowText}
              </div>
              <InfoTooltip
                position="top"
                contentText={thirdRowInfoTooltipText}
              />
              {thirdRowLinkText && (
                <div className="fee-card__link" onClick={() => onThirdRowClick && onThirdRowClick()}>
                  {thirdRowLinkText}
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
  feeRowText: PropTypes.string.isRequired,
  primaryFee: PropTypes.string.isRequired,
  secondaryFee: PropTypes.string,
  thirdRowText: PropTypes.string,
  thirdRowLinkText: PropTypes.string,
  hideThirdRow: PropTypes.bool,
  onThirdRowClick: PropTypes.func,
  thirdRowInfoTooltipText: PropTypes.string,
  primaryMaxFee: PropTypes.string.isRequired,
  secondaryMaxFee: PropTypes.string,
  maxFeeRowText: PropTypes.string.isRequired,
  maxFeeRowLinkText: PropTypes.string,
  onMaxRowClick: PropTypes.func,
  maxFeeRowInfoTooltipText: PropTypes.string,
}
