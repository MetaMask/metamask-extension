import React from 'react';
import PropTypes from 'prop-types';

export default function IconVerified({
  className,
  color = '#4CD964',
  size = 24,
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        fill={color}
        d="m427 256c0 45-18 89-50 121-32 32-76 50-121 50-45 0-89-18-121-50-32-32-50-76-50-121 0-45 18-89 50-121 32-32 76-50 121-50 16 0 32 3 47 7l33-34c-24-10-51-15-80-15-28 0-56 5-82 16-26 11-49 26-69 46-40 40-62 94-62 151 0 57 22 111 62 151 20 20 43 35 69 46 26 11 54 16 82 16 57 0 111-22 151-62 40-40 62-94 62-151z m-258-41l-30 30 96 96 213-213-30-30-183 183z"
      />
    </svg>
  );
}

IconVerified.propTypes = {
  /**
   * Add a className to the root svg of the icon
   */
  className: PropTypes.string,
  /**
   * The fill value of the path element of the svg. Default is #4CD964
   */
  color: PropTypes.string,
  /**
   * The size of the icon in pixels should adhere to the 8px grid
   */
  size: PropTypes.number,
};
