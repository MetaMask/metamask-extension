import React from 'react'
import PropTypes from 'prop-types'

export default function PaperAirplane({ size, className, color }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M22.6001 0.0846465C22.9027 -0.0485745 23.2611 -0.0263377 23.5508 0.164104C23.9463 0.424137 24.1048 0.926235 23.9302 1.36621L15.1985 23.3701C15.0453 23.7562 14.6689 24.0071 14.2535 23.9999C13.8381 23.9926 13.4707 23.7289 13.3309 23.3376L9.99771 14.0046L0.662377 10.6706C0.271138 10.5308 0.00736766 10.1634 0.000151723 9.74798C-0.00706558 9.3326 0.24378 8.95619 0.629931 8.80296L22.6001 0.0846465ZM11.9306 13.4818L20.2936 5.11878L14.32 20.1722L11.9306 13.4818ZM18.8812 3.70792L3.82785 9.68148L10.5182 12.0709L18.8812 3.70792Z"
        fill={color}
      />
    </svg>
  )
}

PaperAirplane.defaultProps = {
  color: '#FFFFFF',
}

PaperAirplane.propTypes = {
  className: PropTypes.string,
  size: PropTypes.number.isRequired,
  color: PropTypes.string,
}
