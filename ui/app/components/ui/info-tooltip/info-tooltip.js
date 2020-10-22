import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
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
  containerClassName,
  wrapperClassName,
  theme,
  color = '#b8b8b8',
}) {

  const themeClassName = classnames('tippy-tooltip-info', {
    'tippy-tooltip-wideInfo': theme === 'wide',
    'tippy-tooltip-extraWideInfo': theme === 'extraWide',
  })

  return (
    <div className="info-tooltip">
      <Tooltip
        interactive
        position={position}
        containerClassName={classnames('info-tooltip__tooltip-container', containerClassName)}
        wrapperClassName={wrapperClassName}
        tooltipInnerClassName="info-tooltip__tooltip-content"
        tooltipArrowClassName={positionArrowClassMap[position]}
        html={contentText}
        theme={themeClassName}
      >
        <svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M5 0C2.2 0 0 2.2 0 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 2c.4 0 .7.3.7.7s-.3.7-.7.7-.7-.2-.7-.6.3-.8.7-.8zm.7 6H4.3V4.3h1.5V8z"
            fill={color}
          />
        </svg>
      </Tooltip>
    </div>
  )
}

InfoTooltip.propTypes = {
  contentText: PropTypes.node,
  position: PropTypes.oneOf(['top', 'left', 'bottom', 'right']),
  containerClassName: PropTypes.string,
  wrapperClassName: PropTypes.string,
  color: PropTypes.string,
  theme: PropTypes.oneOf(['normal', 'wide', 'extraWide']),
}
