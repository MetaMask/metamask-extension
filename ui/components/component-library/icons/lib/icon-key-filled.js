import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconKeyFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M411 97c-61-61-159-61-219 0-42 42-55 102-39 155l-96 97c-7 7-12 20-10 30l6 45c2 14 16 28 31 30l44 7c10 1 24-3 31-11l17-16c4-4 4-11 0-15l-40-40c-6-6-6-15 0-21s16-6 22 0l40 40c4 3 10 3 14 0l43-44c53 17 114 4 156-38 60-60 60-159 0-219zM303 256c-29 0-51-23-51-51s22-51 51-51c28 0 51 23 51 51s-23 51-51 51z" />,
  );
};
IconKeyFilled.propTypes = {
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
