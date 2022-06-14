import React from 'react';
import PropTypes from 'prop-types';

const SearchIcon = ({
  size = 20,
  color = 'currentColor',
  ariaLabel,
  className,
  onClick,
}) => (
  <svg
    width={size}
    height={size}
    fill={color}
    className={className}
    aria-label={ariaLabel}
    onClick={onClick}
    xmlns="http://www.w3.org/2000/svg"
  >
    <g clipRule="evenodd" fillRule="evenodd">
      <path d="M9.167 3.333a5.833 5.833 0 100 11.667 5.833 5.833 0 000-11.667zm-7.5 5.834a7.5 7.5 0 1115 0 7.5 7.5 0 01-15 0z" />
      <path d="M13.286 13.286a.833.833 0 011.178 0l3.625 3.625a.833.833 0 11-1.178 1.178l-3.625-3.625a.833.833 0 010-1.178z" />
    </g>
  </svg>
);

SearchIcon.propTypes = {
  /**
   * The size of the Icon follows an 8px grid 2 = 16px, 3 = 24px etc
   */
  size: PropTypes.number,
  /**
   * The color of the icon accepts design token css variables
   */
  color: PropTypes.string,
  /**
   * An additional className to assign the Icon
   */
  className: PropTypes.string,
  /**
   * The onClick handler
   */
  onClick: PropTypes.func,
  /**
   * The aria-label of the icon for accessibility purposes
   */
  ariaLabel: PropTypes.string,
};

export default SearchIcon;
