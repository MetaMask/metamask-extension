import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconBankFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M456 399v62H47v-62c0-11 9-20 20-20h369c11 0 20 9 20 20zM149 236h-41v143h41zm82 0h-41v143h41zm82 0h-41v143h41zm82 0h-41v143h41zm82 240H26c-8 0-15-7-15-15 0-9 7-16 15-16h451c8 0 15 7 15 16 0 8-7 15-15 15zm-34-348L259 54c-4-1-11-1-15 0L60 128c-8 3-13 11-13 19v68c0 11 9 21 20 21h369c11 0 20-10 20-21v-68c0-8-5-16-13-19zm-191 56c-17 0-31-13-31-30s14-31 31-31 30 14 30 31-13 30-30 30z" />,
  );
};
IconBankFilled.propTypes = {
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
