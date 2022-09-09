import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconMenuOutline = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M441 165H62c-8 0-15-7-15-16s7-16 15-16h379c8 0 15 7 15 16s-7 16-15 16zm0 107H62c-8 0-15-7-15-16s7-16 15-16h379c8 0 15 7 15 16s-7 16-15 16zm0 107H62c-8 0-15-7-15-16s7-16 15-16h379c8 0 15 7 15 16s-7 16-15 16z" />,
  );
};
IconMenuOutline.propTypes = {
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
