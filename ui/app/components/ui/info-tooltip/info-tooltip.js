import React from 'react'
import PropTypes from 'prop-types'
import Tooltip from '../tooltip'

const positionArrowClassMap = {
  top: 'info-tooltip__top-tooltip-arrow',
  bottom: 'info-tooltip__bottom-tooltip-arrow',
  left: 'info-tooltip__left-tooltip-arrow',
  right: 'info-tooltip__right-tooltip-arrow',
}

export default function InfoTooltip ({
  contentText = '',
  position = '',
}) {
  return (
    <div className="info-tooltip">
      <Tooltip
        interactive
        position={position}
        title={contentText}
        tooltipInnerClassName="info-tooltip__tooltip-content"
        tooltipArrowClassName={positionArrowClassMap[position]}
      >
        <img src="images/mm-info-icon.svg" />
      </Tooltip>
    </div>
  )
}

InfoTooltip.propTypes = {
  contentText: PropTypes.string,
  position: PropTypes.oneOf(['top', 'left', 'bottom', 'right']),
}
