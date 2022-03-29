import React from 'react';
import PropTypes from 'prop-types';

const IconCog = ({
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
    <path d="m256 326c-9 0-18-2-27-5-8-4-16-9-23-15-6-7-11-15-15-23-3-9-5-18-5-27 0-9 2-18 5-27 4-8 9-16 15-23 7-6 15-11 23-15 9-3 18-5 27-5 19 0 37 7 50 20 13 13 20 31 20 50 0 19-7 37-20 50-13 13-31 20-50 20z m176-35c3 0 7-2 10-4 2-2 4-6 5-9 0 0 1-10 1-22 0-12-1-22-1-22-1-3-3-7-5-9-3-2-7-4-10-4l-37 0c-7 0-15-4-17-10-2-6-4-23 1-29l26-26c2-2 4-6 4-9 0-4-1-7-3-10l-31-31c-3-2-6-3-10-3-3 0-7 2-9 4l-26 26c-6 5-14 7-19 5-6-3-20-14-20-21l0-37c0-3-2-7-4-10-2-2-6-4-9-5 0 0-10-1-22-1-12 0-22 1-22 1-3 1-7 3-9 5-2 3-4 7-4 10l0 37c0 7-4 15-10 17-6 2-23 4-29-1l-26-26c-2-2-6-4-9-4-4 0-7 1-10 3l-31 31c-2 3-3 6-3 10 0 3 2 7 4 9l26 26c5 6 7 14 5 19-3 6-14 20-21 20l-37 0c-3 0-7 2-10 4-2 2-4 6-5 9 0 0-1 10-1 22 0 12 1 22 1 22 1 7 8 13 15 13l37 0c7 0 15 4 17 10 2 6 4 23-1 29l-26 26c-2 2-4 6-4 9 0 4 1 7 3 10l31 31c3 2 6 3 10 3 3 0 7-2 9-4l26-26c6-5 14-7 19-5 6 3 20 14 20 21l0 37c0 7 6 14 13 15 0 0 10 1 22 1 12 0 22-1 22-1 3-1 7-3 9-5 2-3 4-7 4-10l0-37c0-7 4-15 10-17 6-2 23-4 29 1l26 26c2 2 6 4 9 4 4 0 7-1 10-3l31-31c2-3 3-6 3-10 0-3-2-7-4-9l-26-26c-5-6-7-14-5-19 3-6 14-20 21-20z" />
  </svg>
);

IconCog.propTypes = {
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

export default IconCog;
