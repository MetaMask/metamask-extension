import React from 'react';
import PropTypes from 'prop-types';

export default function BackIcon({
  className,
  width = '18',
  height = '12',
  color = '#BABABA',
}) {
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.0005 5.00001H3.83047L6.71047 2.12001C7.10047 1.73001 7.10047 1.10001 6.71047 0.710011C6.32047 0.320011 5.69047 0.320011 5.30047 0.710011L0.710469 5.30001C0.320469 5.69001 0.320469 6.32001 0.710469 6.71001L5.30047 11.3C5.69047 11.69 6.32047 11.69 6.71047 11.3C7.10047 10.91 7.10047 10.28 6.71047 9.89001L3.83047 7.00001H17.0005C17.5505 7.00001 18.0005 6.55001 18.0005 6.00001C18.0005 5.45001 17.5505 5.00001 17.0005 5.00001Z" fill={color} />
    </svg>

  );
}

BackIcon.propTypes = {
  className: PropTypes.object,
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
