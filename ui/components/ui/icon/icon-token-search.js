import React from 'react';
import PropTypes from 'prop-types';

/**
 * @deprecated This has been deprecated in favor of the `<Icon />` component in ./ui/components/component-library/icon/icon.js
 * See storybook documentation for Icon here https://metamask.github.io/metamask-storybook/?path=/docs/components-componentlibrary-icon--default-story#icon
 */

const IconTokenSearch = ({
  size = 24,
  color = 'currentColor',
  ariaLabel,
  className,
}) => (
  <svg
    width={size}
    height={size}
    fill={color}
    className={className}
    aria-label={ariaLabel}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
  >
    <path d="m233 103c82 0 151 40 152 88-1 47-70 87-152 87-83 0-152-40-152-87 0-48 69-88 152-88z m0 212c-76 0-141-34-151-76 28 34 84 57 151 57 66 0 123-23 150-57-10 42-75 76-150 76z m0 110c-76 0-141-34-151-77 28 35 84 58 151 58 27 0 53-4 76-12 4-1 6-5 6-9 0 0-1-1-1-1 0-5-5-8-10-7-21 7-46 11-71 11-76 0-141-34-151-76 28 34 84 57 151 57 28 0 55-4 78-12 3-1 5-3 6-6l0 0c1-7-4-13-11-11-22 7-47 12-73 12-76 0-141-34-151-77 28 34 84 58 151 58 66 0 123-24 150-58l0 20c0 5 4 10 9 10 5 0 9-5 9-10 0-44 0-104 0-104 0 0 0 0 0 0 0 0 0-1 0-1l0 0c-1-59-74-105-168-105-95 0-168 46-169 105l0 0c0 0 0 1 0 1 0 0 0 0 0 0l0 36 0 0c0 0 0 1 0 1 0 11 0 23 0 35l0 0c0 1 0 3 0 4 0 11 0 23 0 33l0 0c0 2 0 3 0 5l0 32 0 0c0 2 0 4 0 5l0 1c0 1 1 2 1 3 0 1 0 1 0 2 0 1 0 2 1 3 0 1 0 1 0 2 0 1 0 1 0 2 10 35 46 64 96 78l0 0c2 0 4 1 5 1 21 6 43 9 66 9 23 0 45-3 65-9 2 0 3-1 5-1 7-2 13-4 19-6 5-2 6-9 4-13l-1-1c-1-1-2-3-4-3-2-1-4-1-6 0-24 9-52 15-82 15m211 0l-23-24c6-8 9-18 9-29 1-33-30-59-62-48-17 6-29 22-32 41-1 7 0 15 1 22 2 7 6 13 10 19 5 5 10 10 17 13 6 3 13 4 20 4 8 0 17-3 24-8l23 25c1 0 2 1 3 2 1 0 2 0 3 0 2 0 3 0 4 0 1-1 2-2 3-2 1-1 2-2 2-4 1-1 1-2 1-3 0-2 0-3-1-4 0-1-1-3-2-4z m-94-53c0-19 15-35 34-35 18 0 33 15 33 35 0 5-1 10-3 14-1 4-4 8-7 11-3 4-7 6-11 8-4 2-8 3-12 3-20 0-34-16-34-36z" />
  </svg>
);

IconTokenSearch.propTypes = {
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
   * The aria-label of the icon for accessibility purposes
   */
  ariaLabel: PropTypes.string,
};

export default IconTokenSearch;
