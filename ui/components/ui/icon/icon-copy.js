import React from 'react';
import PropTypes from 'prop-types';

const IconCopy = ({
  size = 24,
  color = 'currentColor',
  ariaLabel,
  className,
  onClick,
}) => (
  <svg
    width={size}
    height={size}
    fill={color}
    className={className}
    aria-label={ariaLabel}
    onClick={onClick}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
  >
    <path d="m333 274l0 86c0 72-28 101-100 101l-86 0c-72 0-100-29-100-101l0-86c0-71 28-100 100-100l86 0c72 0 100 29 100 100z m23-223l-86 0c-63 0-93 23-99 77-1 11 8 20 20 20l42 0c86 0 126 40 126 126l0 43c0 11 9 21 21 19 54-6 76-35 76-98l0-86c0-72-28-101-100-101z" />
  </svg>
);

IconCopy.propTypes = {
  /**
   * The size of the icon in pixels. Should follow 8px grid 16, 24, 32, etc
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
   * The onClick handler
   */
  onClick: PropTypes.func,
  /**
   * The aria-label of the icon for accessibility purposes
   */
  ariaLabel: PropTypes.string,
};
export default IconCopy;
