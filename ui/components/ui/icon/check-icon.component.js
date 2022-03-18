import React from 'react';
import PropTypes from 'prop-types';

export default function CheckIcon({
  className,
  width = '25',
  height = '24',
  color = '#3CBB50',
}) {
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.42626 16.1701L5.86923 12.7001C5.46944 12.3101 4.82364 12.3101 4.42386 12.7001C4.02408 13.0901 4.02408 13.7201 4.42386 14.1101L8.7087 18.2901C9.10848 18.6801 9.75429 18.6801 10.1541 18.2901L20.9994 7.71007C21.3992 7.32007 21.3992 6.69007 20.9994 6.30007C20.5997 5.91007 19.9538 5.91007 19.5541 6.30007L9.42626 16.1701Z" fill={color} />
    </svg>


  );
}

CheckIcon.propTypes = {
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
