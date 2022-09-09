import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconEraserFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M436 461H292c-8 0-15-7-15-16 0-8 7-15 15-15h144c9 0 16 7 16 15 0 9-7 16-16 16zM285 352c8 8 8 21 0 29l-61 61c-23 23-59 24-83 4-2-1-3-3-4-4l-72-72c-2-1-3-3-4-4-20-24-19-60 4-83l61-61c8-8 21-8 29 0zm153-124L336 331c-8 8-21 8-29 0L177 200c-8-7-8-20 0-29L279 69c24-24 63-24 87 0l72 72c24 24 24 63 0 87z" />,
  );
};
IconEraserFilled.propTypes = {
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
