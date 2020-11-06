import React from 'react'
import PropTypes from 'prop-types'

const Receive = ({ className, size, color }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="0.5" y="0.5" width="27" height="27" rx="13.5" stroke={color} />
    <path
      d="M14.3465 17.3611C14.3661 17.3402 14.3846 17.3181 14.4018 17.2952L17.597 14.0999C17.7961 13.9063 17.8756 13.6206 17.805 13.352C17.7344 13.0834 17.5246 12.8737 17.2561 12.8031C16.9875 12.7325 16.7017 12.812 16.5082 13.0111L14.5559 14.9633L14.5559 7.25598C14.5616 6.97721 14.4161 6.71715 14.1756 6.5761C13.9351 6.43505 13.6371 6.43505 13.3966 6.5761C13.1561 6.71715 13.0106 6.97721 13.0163 7.25598L13.0163 14.9633L11.064 13.0111C10.8705 12.812 10.5847 12.7325 10.3161 12.8031C10.0476 12.8737 9.83782 13.0834 9.76721 13.352C9.69661 13.6206 9.77608 13.9063 9.97519 14.0999L13.1726 17.2973C13.3093 17.4779 13.5186 17.5891 13.7447 17.6014C13.9709 17.6137 14.191 17.5258 14.3465 17.3611Z"
      fill={color}
    />
    <rect
      x="7.875"
      y="19.25"
      width="12.25"
      height="1.75"
      rx="0.875"
      fill={color}
    />
  </svg>
)

Receive.defaultProps = {
  className: undefined,
}

Receive.propTypes = {
  className: PropTypes.string,
  size: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
}

export default Receive
