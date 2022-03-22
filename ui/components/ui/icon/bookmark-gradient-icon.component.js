import React from 'react';
import PropTypes from 'prop-types';

export default function BookmarkGradient({
  className,
  width = '40',
  height = '40',
}) {
  return (
    <svg className={className}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M28.3335 5H11.6668C9.8335 5 8.3335 6.5 8.3335 8.33333V35L20.0002 30L31.6668 35V8.33333C31.6668 6.5 30.1668 5 28.3335 5ZM28.3335 30L20.0002 26.3667L11.6668 30V8.33333H28.3335V30Z" fill="url(#paint0_linear_313_1076)" />
      <defs>
        <linearGradient id="paint0_linear_313_1076" x1="8.3335" y1="14.8077" x2="33.0352" y2="22.5666" gradientUnits="userSpaceOnUse">
          <stop stop-color="#451DFF" />
          <stop offset="1" stop-color="#FF1D7C" />
        </linearGradient>
      </defs>
    </svg>


  );
}

BookmarkGradient.propTypes = {
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
};
