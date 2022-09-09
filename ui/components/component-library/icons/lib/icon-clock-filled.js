import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconClockFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M252 51C139 51 47 143 47 256s92 205 205 205c112 0 204-92 204-205S364 51 252 51zm89 278c-3 5-8 8-14 8-2 0-5-1-7-3l-64-37c-16-10-27-31-27-49v-84c0-8 7-15 15-15s15 7 15 15v84c0 8 6 18 13 22l63 38c8 4 10 14 6 21z" />,
  );
};
IconClockFilled.propTypes = {
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
