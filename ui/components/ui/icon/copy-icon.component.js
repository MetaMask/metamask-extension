import React from 'react';
import PropTypes from 'prop-types';

const Copy = ({ className, size, color }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 11 11"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M0 0H1H9V1H1V9H0V0ZM2 2H11V11H2V2ZM3 3H10V10H3V3Z"
      fill={color}
    />
  </svg>
);

Copy.defaultProps = {
  className: undefined,
};

Copy.propTypes = {
  /**
   * Additional className
   */
  className: PropTypes.string,
  /**
   * Size of the icon should adhere to 8px grid. e.g: 8, 16, 24, 32, 40
   */
  size: PropTypes.number.isRequired,
  /**
   * Color of the icon should be a valid design system color and is required
   */
  color: PropTypes.string.isRequired,
};

export default Copy;
