import React from 'react';
import PropTypes from 'prop-types';

const IconPlus = ({
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
    <path d="m277 107c0-12-9-22-21-22-12 0-21 10-21 22l0 128-128 0c-12 0-22 9-22 21 0 12 10 21 22 21l128 0 0 128c0 12 9 22 21 22 12 0 21-10 21-22l0-128 128 0c12 0 22-9 22-21 0-12-10-21-22-21l-128 0z" />
  </svg>
);

IconPlus.propTypes = {
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

export default IconPlus;
