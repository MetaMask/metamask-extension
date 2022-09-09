import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconDataFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M415 302c26 0 46-21 46-46s-20-46-46-46c-25 0-46 21-46 46s21 46 46 46zm0-164c26 0 46-20 46-46 0-25-20-46-46-46-25 0-46 21-46 46 0 26 21 46 46 46zm0 328c26 0 46-21 46-46 0-26-20-46-46-46-25 0-46 20-46 46 0 25 21 46 46 46zM88 302c25 0 46-21 46-46s-21-46-46-46c-26 0-46 21-46 46s20 46 46 46zm307-31c8 0 15-7 15-15s-7-15-15-15H246v-87c0-33 14-46 46-46h103c8 0 15-7 15-16 0-8-7-15-15-15H292c-49 0-76 27-76 77v87H108c-8 0-15 7-15 15s7 15 15 15h108v87c0 50 27 77 76 77h103c8 0 15-7 15-15 0-9-7-16-15-16H292c-32 0-46-13-46-46v-87z" />,
  );
};
IconDataFilled.propTypes = {
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
