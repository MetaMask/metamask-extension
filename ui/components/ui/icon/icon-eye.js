import React from 'react';
import PropTypes from 'prop-types';

const IconEye = ({
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
    <path d="m444 247c-36-71-108-119-190-119-82 0-154 48-190 119-1 2-2 6-2 9 0 4 1 7 2 10 36 71 108 118 190 118 82 0 154-47 190-118 1-3 2-6 2-9 0-4-1-8-2-10z m-190 105c-53 0-96-43-96-96 0-53 43-96 96-96 53 0 96 43 96 96l0 1c0 52-43 96-96 96z m0-160c-6 1-12 1-17 3 4 5 6 12 6 19 0 17-14 31-31 31-8 0-14-2-20-6-1 6-2 12-2 17 0 35 29 64 64 64 36 0 64-29 64-64 0-35-28-63-64-63z" />
  </svg>
);

IconEye.propTypes = {
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

export default IconEye;
