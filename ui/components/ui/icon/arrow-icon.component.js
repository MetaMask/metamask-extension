import React from 'react';
import PropTypes from 'prop-types';

export default function ArrowIcon({
  className,
  width = '24',
  height = '24',
  color = '#525252',
}) {
  return (
    <svg className={className}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8.12021 9.29006L12.0002 13.1701L15.8802 9.29006C16.2702 8.90006 16.9002 8.90006 17.2902 9.29006C17.6802 9.68006 17.6802 10.3101 17.2902 10.7001L12.7002 15.2901C12.3102 15.6801 11.6802 15.6801 11.2902 15.2901L6.70021 10.7001C6.31021 10.3101 6.31021 9.68006 6.70021 9.29006C7.09021 8.91006 7.73021 8.90006 8.12021 9.29006Z" fill={color} />
    </svg>


  );
}

ArrowIcon.propTypes = {
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
