import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconCoinFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M455 353c-7 55-52 99-106 106-33 4-64-5-88-22-14-10-10-32 6-37 62-18 110-67 129-129 5-16 26-19 36-6 18 25 27 55 23 88zM210 51c-90 0-163 74-163 164s73 163 163 163c91 0 164-73 164-163S301 51 210 51zm-19 141 49 17c18 6 27 19 27 38 0 22-18 41-39 41h-2v1c0 8-7 15-15 15-9 0-16-7-16-15v-2c-23-1-41-20-41-43 0-9 7-16 16-16 8 0 15 7 15 16 0 7 5 13 12 13h31c4 0 8-4 8-10 0-7-1-7-6-9l-49-17c-18-6-27-19-27-38 0-22 18-41 39-41h2c0-9 7-16 16-16 8 0 15 7 15 16v1c23 1 41 20 41 44 0 8-7 15-15 15-9 0-16-7-16-15s-5-14-12-14h-30c-5 0-9 5-9 10 0 7 1 7 6 9z" />,
  );
};
IconCoinFilled.propTypes = {
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
