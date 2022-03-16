import React from 'react';
import PropTypes from 'prop-types';

export default function MenuIcon({
  width = '18',
  height = '12',
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 18 12"
      fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 12H17C17.55 12 18 11.55 18 11C18 10.45 17.55 10 17 10H1C0.45 10 0 10.45 0 11C0 11.55 0.45 12 1 12ZM1 7H17C17.55 7 18 6.55 18 6C18 5.45 17.55 5 17 5H1C0.45 5 0 5.45 0 6C0 6.55 0.45 7 1 7ZM0 1C0 1.55 0.45 2 1 2H17C17.55 2 18 1.55 18 1C18 0.45 17.55 0 17 0H1C0.45 0 0 0.45 0 1Z" fill="url(#paint0_linear_508_173)" />
      <defs>
        <linearGradient id="paint0_linear_508_173" x1="0.865384" y1="2.20147e-05" x2="13.3761" y2="0.351" gradientUnits="userSpaceOnUse">
          <stop stop-color="#227BFF" />
          <stop offset="1" stop-color="#451DFF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

MenuIcon.propTypes = {
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
