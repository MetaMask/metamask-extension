import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

const ConfirmDetailRow = props => {
  const {
    label,
    fiatText,
    ethText,
    onHeaderClick,
    fiatTextColor,
    headerText,
    headerTextClassName,
  } = props

  return (
    <div className="confirm-detail-row">
      <div className="confirm-detail-row__label">
        { label }
      </div>
      <div className="confirm-detail-row__details">
        <div
          className={classnames('confirm-detail-row__header-text', headerTextClassName)}
          onClick={() => onHeaderClick && onHeaderClick()}
        >
          { headerText }
        </div>
        <div
          className="confirm-detail-row__fiat"
          style={{ color: fiatTextColor }}
        >
          { fiatText }
        </div>
        <div className="confirm-detail-row__eth">
          { ethText }
        </div>
      </div>
    </div>
  )
}

ConfirmDetailRow.propTypes = {
  label: PropTypes.string,
  fiatText: PropTypes.string,
  ethText: PropTypes.string,
  fiatTextColor: PropTypes.string,
  onHeaderClick: PropTypes.func,
  headerText: PropTypes.string,
  headerTextClassName: PropTypes.string,
}

export default ConfirmDetailRow
