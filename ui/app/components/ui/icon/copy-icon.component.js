import React from 'react'
import PropTypes from 'prop-types'

const Copy = ({
  className,
  width,
  height,
  color,
}) => (
  <svg className={className} width={width} height={height} viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M0 0H1H9V1H1V9H0V0ZM2 2H11V11H2V2ZM3 3H10V10H3V3Z" fill={color} />
  </svg>
)

Copy.defaultProps = {
  className: 'copy__icon',
}

Copy.propTypes = {
  className: PropTypes.string,
  width: PropTypes.number,
  height: PropTypes.number,
  color: PropTypes.string.isRequired,
}

export default Copy
