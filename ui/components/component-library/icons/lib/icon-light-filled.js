import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconLightFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M252 399c79 0 143-64 143-143s-64-143-143-143c-80 0-144 64-144 143s64 143 144 143zm0 81c-12 0-21-8-21-19v-2c0-11 9-20 21-20 11 0 20 9 20 20s-9 21-20 21zm146-57c-6 0-11-2-15-6l-2-3c-8-8-8-21 0-29s20-8 28 0l3 3c8 8 8 21 0 29-4 4-9 6-14 6zm-293 0c-5 0-10-2-14-6-8-8-8-21 0-29l2-3c8-8 21-8 29 0s8 21 0 29l-2 3c-4 4-10 6-15 6zm351-147h-1c-12 0-21-9-21-20s9-20 21-20c11 0 21 9 21 20s-8 20-20 20zm-408 0h-1c-12 0-21-9-21-20s9-20 21-20c11 0 21 9 21 20s-8 20-20 20zm347-143c-5 0-10-2-14-6-8-8-8-21 0-29l2-3c8-8 21-8 29 0s8 21 0 29l-3 3c-3 4-9 6-14 6zm-287 0c-5 0-10-2-15-6l-2-3c-8-8-8-21 0-29s21-8 29 0l2 3c8 8 8 21 0 29-4 4-9 6-14 6zm144-60c-12 0-21-9-21-20v-2c0-11 9-20 21-20 11 0 20 9 20 20s-9 22-20 22z" />,
  );
};
IconLightFilled.propTypes = {
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
