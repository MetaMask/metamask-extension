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
        containerClassName="info-tooltip__tooltip-container"
        tooltipInnerClassName="info-tooltip__tooltip-content"
        tooltipArrowClassName={positionArrowClassMap[position]}
        html={contentText}
        theme="tippy-tooltip-info"
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
