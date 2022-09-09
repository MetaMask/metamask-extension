import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconDangerFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M443 342 317 101c-16-32-40-50-65-50-26 0-50 18-66 50L60 342c-16 30-18 60-5 83s38 36 71 36h251c33 0 58-13 71-36s11-53-5-83zM237 197c0-8 6-15 15-15 8 0 14 7 14 15v105c0 8-6 15-14 15-9 0-15-7-15-15zm28 182-3 3c-1 0-2 1-3 1-1 1-2 1-4 2h-7c-2-1-3-1-4-2-1 0-2-1-3-1l-3-3c-4-4-6-9-6-15 0-5 2-11 6-15 1 0 2-1 3-2s2-2 3-2c1-1 2-1 4-1 2-1 5-1 7 0 2 0 3 0 4 1 1 0 2 1 3 2s2 2 3 2c4 4 6 10 6 15 0 6-2 11-6 15z" />,
  );
};
IconDangerFilled.propTypes = {
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
