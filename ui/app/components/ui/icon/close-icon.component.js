import React from 'react'
import PropTypes from 'prop-types'

const Copy = ({
  className,
  size,
  color,
}) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M0.561602 13.4766C0.871724 13.7867 1.37453 13.7867 1.68465 13.4766L7.01912 8.14214L12.5303 13.6533C12.8404 13.9634 13.3432 13.9634 13.6533 13.6533C13.9635 13.3432 13.9635 12.8404 13.6533 12.5303L8.14217 7.01909L13.4767 1.68456C13.7868 1.37444 13.7868 0.871633 13.4767 0.561511C13.1666 0.251388 12.6638 0.251387 12.3536 0.56151L7.01912 5.89604L1.86129 0.738211C1.55117 0.428089 1.04836 0.428089 0.738241 0.738212C0.428119 1.04833 0.428118 1.55114 0.73824 1.86126L5.89607 7.01909L0.561602 12.3536C0.251479 12.6637 0.25148 13.1665 0.561602 13.4766Z"
      fill={color}
    />
  </svg>
)

Copy.defaultProps = {
  className: undefined,
}

Copy.propTypes = {
  className: PropTypes.string,
  size: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
}

export default Copy
