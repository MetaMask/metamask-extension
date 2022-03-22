import React from 'react';
import PropTypes from 'prop-types';

export default function TuneIcon({
  className,
  width = '40',
  height = '40',
}) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg"
      className={className}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`} fill="none">
      <path d="M5 30C5 30.9167 5.75 31.6667 6.66667 31.6667H15V28.3333H6.66667C5.75 28.3333 5 29.0833 5 30ZM5 10C5 10.9167 5.75 11.6667 6.66667 11.6667H21.6667V8.33333H6.66667C5.75 8.33333 5 9.08333 5 10ZM21.6667 33.3333V31.6667H33.3333C34.25 31.6667 35 30.9167 35 30C35 29.0833 34.25 28.3333 33.3333 28.3333H21.6667V26.6667C21.6667 25.75 20.9167 25 20 25C19.0833 25 18.3333 25.75 18.3333 26.6667V33.3333C18.3333 34.25 19.0833 35 20 35C20.9167 35 21.6667 34.25 21.6667 33.3333ZM11.6667 16.6667V18.3333H6.66667C5.75 18.3333 5 19.0833 5 20C5 20.9167 5.75 21.6667 6.66667 21.6667H11.6667V23.3333C11.6667 24.25 12.4167 25 13.3333 25C14.25 25 15 24.25 15 23.3333V16.6667C15 15.75 14.25 15 13.3333 15C12.4167 15 11.6667 15.75 11.6667 16.6667ZM35 20C35 19.0833 34.25 18.3333 33.3333 18.3333H18.3333V21.6667H33.3333C34.25 21.6667 35 20.9167 35 20ZM26.6667 15C27.5833 15 28.3333 14.25 28.3333 13.3333V11.6667H33.3333C34.25 11.6667 35 10.9167 35 10C35 9.08333 34.25 8.33333 33.3333 8.33333H28.3333V6.66667C28.3333 5.75 27.5833 5 26.6667 5C25.75 5 25 5.75 25 6.66667V13.3333C25 14.25 25.75 15 26.6667 15Z" fill="url(#paint0_linear_311_779)" />
      <defs>
        <linearGradient id="paint0_linear_311_779" x1="5" y1="14.8077" x2="35" y2="26.9231" gradientUnits="userSpaceOnUse">
          <stop stop-color="#451DFF" />
          <stop offset="1" stop-color="#FF1D7C" />
        </linearGradient>
      </defs>
    </svg>

  );
}

TuneIcon.propTypes = {
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
