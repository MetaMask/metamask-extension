import React from 'react';
import PropTypes from 'prop-types';

export default function NetWorkTreeIcon({
  className,
  width = '40',
  height = '40',
  color = '#3CBB50',
}) {
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M36.6668 18.3333V5H25.0002V10H15.0002V5H3.3335V18.3333H15.0002V13.3333H18.3335V30H25.0002V35H36.6668V21.6667H25.0002V26.6667H21.6668V13.3333H25.0002V18.3333H36.6668ZM11.6668 15H6.66683V8.33333H11.6668V15ZM28.3335 25H33.3335V31.6667H28.3335V25ZM28.3335 8.33333H33.3335V15H28.3335V8.33333Z" fill={color} />
    </svg>

  );
}

NetWorkTreeIcon.propTypes = {
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
