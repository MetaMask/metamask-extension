import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconSwapHorizontalOutline = ({
  size,
  color,
  className,
  ...props
}) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M360 240c-4 0-8-2-11-5-6-6-6-16 0-22l65-65-65-65c-6-6-6-16 0-22s16-6 21 0l77 76c3 3 4 7 4 11s-1 8-4 11l-77 76c-3 3-6 5-10 5zm76-77H67c-8 0-15-7-15-15s7-15 15-15h369c8 0 15 7 15 15s-7 15-15 15zM143 456c-4 0-7-2-10-5l-77-76c-3-3-4-7-4-11s1-8 4-11l77-76c5-6 15-6 21 0s6 16 0 22l-65 65 65 65c6 6 6 16 0 22-3 3-7 5-11 5zm293-77H67c-8 0-15-7-15-15s7-15 15-15h369c8 0 15 7 15 15s-7 15-15 15z" />,
  );
};
IconSwapHorizontalOutline.propTypes = {
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
