import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconEyeFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M441 198C394 123 324 80 252 80c-37 0-72 11-105 31-32 20-61 49-85 87-20 32-20 84 0 116 47 75 117 117 190 117 36 0 71-10 104-30 32-20 61-50 85-87 20-32 20-84 0-116zM252 339c-46 0-83-37-83-83s37-83 83-83c45 0 82 37 82 83s-37 83-82 83zm0-142c-33 0-59 27-59 59s26 58 59 58c32 0 58-26 58-58s-26-59-58-59z" />,
  );
};
IconEyeFilled.propTypes = {
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
