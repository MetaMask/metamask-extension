import React from 'react';
import PropTypes from 'prop-types';

const Copy = ({ className, size, color }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox={`0 0 10 12`} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.5 0.5H1C0.45 0.5 0 0.95 0 1.5V8C0 8.275 0.225 8.5 0.5 8.5C0.775 8.5 1 8.275 1 8V2C1 1.725 1.225 1.5 1.5 1.5H6.5C6.775 1.5 7 1.275 7 1C7 0.725 6.775 0.5 6.5 0.5ZM8.5 2.5H3C2.45 2.5 2 2.95 2 3.5V10.5C2 11.05 2.45 11.5 3 11.5H8.5C9.05 11.5 9.5 11.05 9.5 10.5V3.5C9.5 2.95 9.05 2.5 8.5 2.5ZM8 10.5H3.5C3.225 10.5 3 10.275 3 10V4C3 3.725 3.225 3.5 3.5 3.5H8C8.275 3.5 8.5 3.725 8.5 4V10C8.5 10.275 8.275 10.5 8 10.5Z" fill={color} />
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
