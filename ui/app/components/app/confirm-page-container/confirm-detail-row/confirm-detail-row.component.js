import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import UserPreferencedCurrencyDisplay from '../../user-preferenced-currency-display'
import { PRIMARY /* , SECONDARY */ } from '../../../../helpers/constants/common'

const ConfirmDetailRow = (props) => {
  const {
    label,
    primaryText,
    // secondaryText,
    onHeaderClick,
    primaryValueTextColor,
    headerText,
    headerTextClassName,
    value,
    sponsored,
    // type = 'fee',
    primaryPrefix,
    primaryPrefixStyle = {},
  } = props

  return (
    <div className="confirm-detail-row">
      <div className="confirm-detail-row__label">{label}</div>
      <div className="confirm-detail-row__details">
        <div
          className={classnames(
            'confirm-detail-row__header-text',
            headerTextClassName
          )}
          onClick={() => onHeaderClick && onHeaderClick()}
        >
          {headerText}
        </div>
        <div className="confirm-detail-row__primary-group">
          {primaryPrefix && (
            <div
              className="confirm-detail-row__primary-prefix"
              style={primaryPrefixStyle}
            >
              {primaryPrefix}
            </div>
          )}
          {primaryText ? (
            <div
              className={`confirm-detail-row__primary ${
                sponsored ? 'sponsored' : ''
              }`}
              style={{ color: primaryValueTextColor }}
            >
              {primaryText}
            </div>
          ) : (
            <UserPreferencedCurrencyDisplay
              className={`confirm-detail-row__primary ${
                sponsored ? 'sponsored' : ''
              }`}
              type={PRIMARY}
              value={value}
              showEthLogo
              ethLogoHeight="18"
              style={{ color: primaryValueTextColor }}
              hideLabel
            />
          )}
        </div>
        {/* {secondaryText ? ( */}
        {/*   <div className="confirm-detail-row__secondary">{secondaryText}</div> */}
        {/* ) : ( */}
        {/*   <UserPreferencedCurrencyDisplay */}
        {/*     className="confirm-detail-row__secondary" */}
        {/*     type={SECONDARY} */}
        {/*     value={value} */}
        {/*     showEthLogo */}
        {/*     hideLabel */}
        {/*   /> */}
        {/* )} */}
      </div>
    </div>
  )
}

ConfirmDetailRow.propTypes = {
  headerText: PropTypes.string,
  headerTextClassName: PropTypes.string,
  label: PropTypes.string,
  onHeaderClick: PropTypes.func,
  primaryValueTextColor: PropTypes.string,
  primaryText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  sponsored: PropTypes.bool,
  // secondaryText: PropTypes.string,
  value: PropTypes.string,
  // type: PropTypes.oneOf(['fee', 'collateral']),
  primaryPrefix: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  primaryPrefixStyle: PropTypes.object,
}

export default ConfirmDetailRow
