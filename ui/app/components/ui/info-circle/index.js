import React from 'react'
import PropTypes from 'prop-types'

InfoCircle.propTypes = {
  color: PropTypes.string,
  width: PropTypes.string,
  height: PropTypes.string,
  viewBox: PropTypes.string,
}

InfoCircle.defaultProps = {
  color: '#848C96',
  width: '22',
  height: '22',
  viewBox: '0 0 22 22',
}

export default function InfoCircle ({
  color = '#848C96',
  width = '22',
  height = '22',
  viewBox = '0 0 22 22',
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11 2C15.9706 2 20 6.02944 20 11C20 15.9706 15.9706 20 11 20C6.02944 20 2 15.9706 2 11C2 6.02944 6.02944 2 11 2ZM22 11C22 4.92487 17.0751 0 11 0C4.92487 0 0 4.92487 0 11C0 17.0751 4.92487 22 11 22C17.0751 22 22 17.0751 22 11Z"
        fill={color}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11 10C10.4477 10 10 10.4477 10 11V15C10 15.5523 10.4477 16 11 16C11.5523 16 12 15.5523 12 15V11C12 10.4477 11.5523 10 11 10Z"
        fill={color}
      />
      <path
        d="M10 7C10 7.55228 10.4477 8 11 8C11.5523 8 12 7.55228 12 7C12 6.44772 11.5523 6 11 6C10.4477 6 10 6.44772 10 7Z"
        fill={color}
      />
    </svg>
  )
}
