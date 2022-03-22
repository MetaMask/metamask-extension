import React from 'react';
import PropTypes from 'prop-types';

export default function EastIcon({
  className,
  width = '24',
  height = '24',
  color = '#323232',
}) {
  return (
    <svg className={className}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <g opacity="0.44">
        <path d="M14.29 5.70998C13.9 6.09998 13.9 6.72998 14.29 7.11998L18.17 11H3C2.45 11 2 11.45 2 12C2 12.55 2.45 13 3 13H18.18L14.3 16.88C13.91 17.27 13.91 17.9 14.3 18.29C14.69 18.68 15.32 18.68 15.71 18.29L21.3 12.7C21.69 12.31 21.69 11.68 21.3 11.29L15.7 5.70998C15.32 5.31998 14.68 5.31998 14.29 5.70998Z" fill={color} />
      </g>
    </svg>


  );
}

EastIcon.propTypes = {
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
