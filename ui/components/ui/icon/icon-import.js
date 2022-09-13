import React from 'react';
import PropTypes from 'prop-types';

const IconImport = ({
  size = 24,
  color = 'currentColor',
  ariaLabel,
  className,
}) => (
  <svg
    width={size}
    height={size}
    fill={color}
    className={className}
    aria-label={ariaLabel}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
  >
    <path d="m256 85c12 0 21 10 21 22l0 183 71-70c8-9 21-9 30 0 8 8 8 21 0 30l-107 106 0 1c-4 3-9 6-15 6l0 0c-3 0-6-1-8-2-3-1-5-3-7-5l-107-106c-8-9-8-22 0-30 9-9 22-9 30 0l71 70 0-183c0-12 9-22 21-22z m-149 299c-12 0-22 10-22 21 0 12 10 22 22 22l298 0c12 0 22-10 22-22 0-11-10-21-22-21z" />
  </svg>
);

IconImport.propTypes = {
  /**
   * The size of the Icon follows an 8px grid 2 = 16px, 3 = 24px etc
   */
  size: PropTypes.number,
  /**
   * The color of the icon accepts design token css variables
   */
  color: PropTypes.string,
  /**
   * An additional className to assign the Icon
   */
  className: PropTypes.string,
  /**
   * The aria-label of the icon for accessibility purposes
   */
  ariaLabel: PropTypes.string,
};

export default IconImport;
