import React from 'react';
import PropTypes from 'prop-types';

/**
 * @deprecated This has been deprecated in favor of the `<Icon />` component in ./ui/components/component-library/icon/icon.js
 * See storybook documentation for Icon here https://metamask.github.io/metamask-storybook/?path=/docs/components-componentlibrary-icon--default-story#icon
 */

const Interaction = ({ className, size, color }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 30 30"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M15 29C22.732 29 29 22.732 29 15C29 7.26801 22.732 1 15 1C7.26801 1 1 7.26801 1 15C1 22.732 7.26801 29 15 29Z"
      stroke={color}
    />
    <path
      d="M18.8889 18.65C18.8889 18.8433 18.7322 19 18.5389 19H11.4611C11.2678 19 11.1111 18.8433 11.1111 18.65V17.4621C11.1111 17.1479 10.7292 16.9928 10.5102 17.2181L8.2372 19.556C8.10513 19.6919 8.10513 19.9081 8.2372 20.044L10.5102 22.3819C10.7292 22.6072 11.1111 22.4521 11.1111 22.1379V20.95C11.1111 20.7567 11.2678 20.6 11.4611 20.6H20.0944C20.2877 20.6 20.4444 20.4433 20.4444 20.25V16.15C20.4444 15.9567 20.2877 15.8 20.0944 15.8H19.2389C19.0456 15.8 18.8889 15.9567 18.8889 16.15V18.65ZM11.1111 12.35C11.1111 12.1567 11.2678 12 11.4611 12H18.5389C18.7322 12 18.8889 12.1567 18.8889 12.35V13.5379C18.8889 13.8521 19.2708 14.0072 19.4898 13.7819L21.7628 11.444C21.8949 11.3081 21.8949 11.0919 21.7628 10.956L19.4898 8.61812C19.2708 8.39284 18.8889 8.5479 18.8889 8.8621V10.05C18.8889 10.2433 18.7322 10.4 18.5389 10.4H9.90556C9.71226 10.4 9.55556 10.5567 9.55556 10.75V14.85C9.55556 15.0433 9.71226 15.2 9.90556 15.2H10.7611C10.9544 15.2 11.1111 15.0433 11.1111 14.85V12.35Z"
      fill={color}
    />
  </svg>
);

Interaction.defaultProps = {
  className: undefined,
};

Interaction.propTypes = {
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

export default Interaction;
