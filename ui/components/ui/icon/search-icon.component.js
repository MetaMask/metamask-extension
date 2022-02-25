import React from 'react';
import PropTypes from 'prop-types';

export default function SearchIcon({ className, size, color }) {
  return (
    <svg
      className={className}
      height={size}
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        fill={color}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.9977 19.9955C13.0486 19.9955 15.0272 19.2953 16.6141 18.0274L20.2882 21.7015C20.3807 21.7955 20.4909 21.8703 20.6125 21.9215C20.7341 21.9728 20.8646 21.9994 20.9965 22C21.1285 22.0005 21.2592 21.9749 21.3812 21.9247C21.5032 21.8745 21.614 21.8006 21.7073 21.7073C21.8006 21.614 21.8745 21.5032 21.9247 21.3812C21.9749 21.2592 22.0005 21.1285 22 20.9965C21.9994 20.8646 21.9728 20.7341 21.9215 20.6125C21.8703 20.4909 21.7955 20.3807 21.7014 20.2882L18.0274 16.6141C19.2953 15.0272 19.9955 13.0486 19.9955 10.9977C19.9955 9.81614 19.7627 8.64611 19.3106 7.55445C18.8584 6.4628 18.1956 5.47089 17.3601 4.63538C16.5246 3.79986 15.5327 3.13709 14.441 2.68491C13.3494 2.23273 12.1793 2 10.9977 2C9.81614 2 8.64611 2.23273 7.55445 2.68491C6.4628 3.13709 5.47089 3.79986 4.63538 4.63538C3.79986 5.47089 3.13709 6.4628 2.68491 7.55445C2.23273 8.64611 2 9.81614 2 10.9977C2 13.3841 2.94797 15.6727 4.63538 17.3601C6.32278 19.0475 8.61139 19.9955 10.9977 19.9955ZM11 18C14.866 18 18 14.866 18 11C18 7.13401 14.866 4 11 4C7.13401 4 4 7.13401 4 11C4 14.866 7.13401 18 11 18Z"
      />
    </svg>
  );
}

SearchIcon.defaultProps = {
  className: undefined,
};

SearchIcon.propTypes = {
  /**
   * Additional className
   */
  className: PropTypes.string,
  /**
   * Size of the icon should adhere to 8px grid. e.g: 8, 16, 24, 32, 40
   */
  size: PropTypes.number.isRequired,
  /**
   * Color of the icon should be a valid design system color and is required
   */
  color: PropTypes.string.isRequired,
};
