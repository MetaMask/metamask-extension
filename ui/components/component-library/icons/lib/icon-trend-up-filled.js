import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconTrendUpFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M337 51H166C91 51 47 96 47 170v172c0 74 44 119 119 119h171c75 0 119-45 119-119V170c0-74-44-119-119-119zm14 195c0 8-6 15-14 15s-14-7-14-15v-3l-56 55c-3 3-7 5-11 4-5 0-9-2-11-6l-21-31-48 49c-3 3-7 4-10 4-4 0-8-2-11-4-5-6-5-15 0-21l62-61c3-3 7-4 11-4 4 1 8 3 10 7l21 31 44-43h-4c-8 0-15-7-15-15s7-14 15-14h38c2 0 4 0 5 1 4 1 7 4 8 8 1 2 1 3 1 5v38z" />,
  );
};
IconTrendUpFilled.propTypes = {
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
