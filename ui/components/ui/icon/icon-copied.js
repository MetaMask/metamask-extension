import React from 'react';
import PropTypes from 'prop-types';

const IconCopied = ({
  size = 24,
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
    viewBox="0 0 24 24"
  >
    <path d="M16.59 3H12.81C10.0352 3 8.73388 3.98468 8.46277 6.36511C8.40605 6.86311 8.81849 7.275 9.31971 7.275H11.19C14.97 7.275 16.725 9.03 16.725 12.81V14.6803C16.725 15.1815 17.1369 15.594 17.6349 15.5372C20.0153 15.2661 21 13.9648 21 11.19V7.41C21 4.26 19.74 3 16.59 3Z" />
    <path d="M11.19 8.4H7.41C4.26 8.4 3 9.66 3 12.81V16.59C3 19.74 4.26 21 7.41 21H11.19C14.34 21 15.6 19.74 15.6 16.59V12.81C15.6 9.66 14.34 8.4 11.19 8.4ZM12.261 13.485L8.922 16.824C8.796 16.95 8.634 17.013 8.463 17.013C8.292 17.013 8.13 16.95 8.004 16.824L6.33 15.15C6.078 14.898 6.078 14.493 6.33 14.241C6.582 13.989 6.987 13.989 7.239 14.241L8.454 15.456L11.343 12.567C11.595 12.315 12 12.315 12.252 12.567C12.504 12.819 12.513 13.233 12.261 13.485Z" />
  </svg>
);

IconCopied.propTypes = {
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

export default IconCopied;
