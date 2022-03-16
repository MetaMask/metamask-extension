import React from 'react';
import PropTypes from 'prop-types';

export default function EditIcon({
  width = '20',
  height = '20',
  color = 'white',
}) {
  return (
    <svg width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.5 14.5501V17.0835C2.5 17.3168 2.68333 17.5001 2.91667 17.5001H5.45C5.55833 17.5001 5.66667 17.4585 5.74167 17.3751L14.8417 8.28346L11.7167 5.15846L2.625 14.2501C2.54167 14.3335 2.5 14.4335 2.5 14.5501ZM17.2583 5.8668C17.5833 5.5418 17.5833 5.0168 17.2583 4.6918L15.3083 2.7418C14.9833 2.4168 14.4583 2.4168 14.1333 2.7418L12.6083 4.2668L15.7333 7.3918L17.2583 5.8668Z" fill={color} />
    </svg>

  );
}

EditIcon.propTypes = {
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
