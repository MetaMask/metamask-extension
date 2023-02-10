import React from 'react';
import PropTypes from 'prop-types';

const IconBlockExplorer = ({
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
    <path d="m316 444l-106 0c-96 0-141-43-141-140l0-107c0-96 45-140 141-140l35 0c5 0 9 2 12 5 3 3 4 7 4 11 0 4-1 8-4 11-3 3-7 5-12 5l-35 0c-80 0-109 28-109 108l0 107c0 80 29 108 109 108l106 0c80 0 109-28 109-108l0-36c0-4 1-8 4-11 3-3 8-5 12-5 4 0 8 2 11 5 3 3 5 7 5 11l0 36c0 97-44 140-141 140z m-35-195c-4 0-9-2-12-5-3-3-4-7-4-11 0-4 1-8 4-11l133-133-47 0c-4 0-8-2-11-5-3-3-5-7-5-11 0-4 2-8 5-11 3-3 7-5 11-5l86 0c2 0 4 0 6 1 2 1 4 2 5 3 2 2 3 4 4 6 0 2 1 4 1 6l0 85c0 4-2 9-5 12-3 3-7 4-11 4-4 0-9-1-12-4-3-3-4-8-4-12l0-47-133 133c-3 3-7 5-11 5z" />
  </svg>
);

IconBlockExplorer.propTypes = {
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

export default IconBlockExplorer;
