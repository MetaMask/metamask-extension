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
    >
      <g clipRule="evenodd" fillRule="evenodd" fill={color}>
        <path d="M9.167 3.333a5.833 5.833 0 100 11.667 5.833 5.833 0 000-11.667zm-7.5 5.834a7.5 7.5 0 1115 0 7.5 7.5 0 01-15 0z" />
        <path d="M13.286 13.286a.833.833 0 011.178 0l3.625 3.625a.833.833 0 11-1.178 1.178l-3.625-3.625a.833.833 0 010-1.178z" />
      </g>
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
