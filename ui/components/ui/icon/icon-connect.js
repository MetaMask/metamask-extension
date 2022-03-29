import React from 'react';
import PropTypes from 'prop-types';

const IconConnect = ({
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
    <path d="m213 79l22-31c6-7 15-7 21 0l23 33c6 7 3 15-7 15l-18 0 0 175c0 4 4 4 7 1l37-37c6-6 8-15 8-24l0-35c-10 0-17-8-17-18l0-18c0-9 7-18 17-18l18 0c10 0 17 8 17 18l0 18c0 10-7 18-17 18l0 35c0 15-4 27-15 37l-45 46c-6 6-10 9-10 24l0 73c18 4 31 19 31 38 0 23-18 40-40 40-21 0-39-17-39-40 0-19 13-34 31-38l0-20c0-14-5-19-11-25l-45-46c-8-9-14-20-14-35l0-37c-10-3-18-14-18-26 0-14 12-26 27-26 14 0 26 12 26 26 0 12-8 23-18 26l0 37c0 10 5 18 10 23l37 38c3 2 6 2 6-2l0-228-18 0c-10 0-13-8-6-17z" />
  </svg>
);

IconConnect.propTypes = {
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

export default IconConnect;
