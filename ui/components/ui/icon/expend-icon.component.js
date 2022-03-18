import React from 'react';
import PropTypes from 'prop-types';

export default function ExpendIcon({
  width = '16',
  height = '16',
  color = 'white',
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M15.5 5.15833V1.33333C15.5 0.875 15.125 0.5 14.6667 0.5H10.8417C10.1 0.5 9.725 1.4 10.25 1.925L11.575 3.25L3.24167 11.5833L1.91667 10.2583C1.4 9.73333 0.5 10.1 0.5 10.8417V14.6667C0.5 15.125 0.875 15.5 1.33333 15.5H5.15833C5.9 15.5 6.275 14.6 5.75 14.075L4.425 12.75L12.7583 4.41667L14.0833 5.74167C14.6 6.26667 15.5 5.9 15.5 5.15833Z" fill={color} />
    </svg>


  );
}

ExpendIcon.propTypes = {
  /**
   * Width of the icon
   */
  width: PropTypes.string,
  /**
   * Height of the icon
   */
  height: PropTypes.string,
  /**
   * Color of the icon should be a valid design system color
   */
  color: PropTypes.string,
};
