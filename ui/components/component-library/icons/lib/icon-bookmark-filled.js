import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconBookmarkFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M456 170v172c0 66-53 119-119 119H166c-66 0-119-53-119-119V170c0-51 21-88 58-106 13-6 29 4 29 19v182c0 24 9 43 26 53s39 8 61-5l27-16c1-1 6-1 7-1l27 17c15 8 27 11 38 11 10 0 18-3 23-6 17-10 26-29 26-53V83c0-15 16-25 29-19 37 18 58 55 58 106zM318 51c11 0 21 9 21 21v193c0 13-4 23-11 26-7 5-18 2-30-5l-27-16c-11-6-28-6-39 0l-27 16c-12 7-23 9-30 5-7-3-11-13-11-26V72c0-12 10-21 21-21z" />,
  );
};
IconBookmarkFilled.propTypes = {
  /**
   * The size of the BaseIcon.
   * Possible values could be 'xxs', 'xs', 'sm', 'md', 'lg', 'xl',
   */
  size: PropTypes.oneOf(Object.values(SIZES)),

  /**
   * The color of the icon. Defaults to 'inherit'.
   */
  color: PropTypes.string,

  /**
   * An additional class name to apply to the icon.
   */
  className: PropTypes.string,

  /**
   * BaseIcon accepts all the props from Box
   */
  ...Box.propTypes,
};
