import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

const Preloader = ({ className, size }) => (
  <svg
    className={classnames('preloader__icon', className)}
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8 13.7143C4.84409 13.7143 2.28571 11.1559 2.28571 8C2.28571 4.84409 4.84409 2.28571 8 2.28571C11.1559 2.28571 13.7143 4.84409 13.7143 8C13.7143 11.1559 11.1559 13.7143 8 13.7143ZM8 16C3.58172 16 0 12.4183 0 8C0 3.58172 3.58172 0 8 0C12.4183 0 16 3.58172 16 8C16 12.4183 12.4183 16 8 16Z"
      fill="#C1DAEC"
    />
    <mask
      id="mask0"
      mask-type="alpha"
      maskUnits="userSpaceOnUse"
      x="0"
      y="0"
      width="16"
      height="16"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 13.7143C4.84409 13.7143 2.28571 11.1559 2.28571 8C2.28571 4.84409 4.84409 2.28571 8 2.28571C11.1559 2.28571 13.7143 4.84409 13.7143 8C13.7143 11.1559 11.1559 13.7143 8 13.7143ZM8 16C3.58172 16 0 12.4183 0 8C0 3.58172 3.58172 0 8 0C12.4183 0 16 3.58172 16 8C16 12.4183 12.4183 16 8 16Z"
        fill="#037DD6"
      />
    </mask>
    <g mask="url(#mask0)">
      <path
        d="M6.85718 17.9999V11.4285V8.28564H-4.85711V17.9999H6.85718Z"
        fill="#037DD6"
      />
    </g>
  </svg>
)

Preloader.defaultProps = {
  className: undefined,
}

Preloader.propTypes = {
  className: PropTypes.string,
  size: PropTypes.number.isRequired,
}

export default Preloader
