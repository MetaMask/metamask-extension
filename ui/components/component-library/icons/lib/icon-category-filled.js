import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconCategoryFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M154 51h-39c-45 0-68 24-68 68v39c0 45 23 69 68 69h39c44 0 68-24 68-69v-39c0-44-23-68-68-68zm234 0h-39c-44 0-68 24-68 68v39c0 45 24 69 68 69h39c45 0 68-24 68-69v-39c0-44-23-68-68-68zm0 234h-39c-44 0-68 24-68 68v39c0 45 24 69 68 69h39c45 0 68-24 68-69v-39c0-44-23-68-68-68zm-234 0h-39c-45 0-68 24-68 68v39c0 45 23 69 68 69h39c44 0 68-24 68-68v-39c0-45-23-69-68-69z" />,
  );
};
IconCategoryFilled.propTypes = {
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
