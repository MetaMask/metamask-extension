import React from 'react';
import PropTypes from 'prop-types';

const IconCaretLeft = ({
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
    <path d="m335 113c8 8 8 22 0 30l-113 113 113 113c8 8 8 22 0 30-8 8-22 8-30 0l-128-128c-8-8-8-22 0-30l128-128c8-8 22-8 30 0z" />
  </svg>
);

IconCaretLeft.propTypes = {
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
   * The onClick handler
   */
  onClick: PropTypes.func,
  /**
   * The aria-label of the icon for accessibility purposes
   */
  ariaLabel: PropTypes.string,
};

export default IconCaretLeft;
