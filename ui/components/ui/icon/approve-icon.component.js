import React from 'react';
import PropTypes from 'prop-types';

/**
 * @deprecated This has been deprecated in favor of the `<Icon />` component in ./ui/components/component-library/icon/icon.js
 * See storybook documentation for Icon here https://metamask.github.io/metamask-storybook/?path=/docs/components-componentlibrary-icon--default-story#icon
 */

const Approve = ({ className, size, color }) => (
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
      d="M5.34426 16.0923C5.15708 16.2694 5.15656 16.5672 5.34311 16.745L9.49708 20.7032C9.67134 20.8692 9.94541 20.8687 10.1191 20.7021L10.682 20.1619C10.867 19.9844 10.8665 19.6883 10.6808 19.5114L6.53084 15.557C6.35747 15.3918 6.08509 15.3914 5.91113 15.556L5.34426 16.0923ZM24.0891 10.2959C23.9152 10.1303 23.6419 10.1303 23.4681 10.2961L14.9882 18.3839C14.8143 18.5498 14.5407 18.5497 14.3668 18.3837L11.4072 15.5567C11.2343 15.3916 10.9625 15.3905 10.7882 15.5542L10.2154 16.0924C10.0272 16.2692 10.0261 16.5679 10.2131 16.7461L14.367 20.7042C14.5408 20.8698 14.814 20.8698 14.9878 20.7042L24.6581 11.4897C24.8442 11.3124 24.8442 11.0155 24.6581 10.8382L24.0891 10.2959ZM19.7905 11.4886C19.9761 11.3117 19.9767 11.0156 19.7916 10.8381L19.2288 10.2979C19.0551 10.1313 18.781 10.1308 18.6068 10.2968L13.799 14.878C13.6125 15.0557 13.613 15.3535 13.8002 15.5306L14.367 16.067C14.541 16.2316 14.8134 16.2311 14.9868 16.0659L19.7905 11.4886Z"
      fill={color}
    />
  </svg>
);

Approve.defaultProps = {
  className: undefined,
};

Approve.propTypes = {
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

export default Approve;
