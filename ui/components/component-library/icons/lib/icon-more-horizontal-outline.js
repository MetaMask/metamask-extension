import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconMoreHorizontalOutline = ({
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
    <path d="M108 215c-22 0-41 18-41 41s19 41 41 41c23 0 41-18 41-41s-18-41-41-41zm287 0c-23 0-41 18-41 41s18 41 41 41c22 0 41-18 41-41s-19-41-41-41zm-143 0c-23 0-41 18-41 41s18 41 41 41c22 0 40-18 40-41s-18-41-40-41zM5 10c-1 0-2 1-2 2s1 2 2 2 2-1 2-2-1-2-2-2zm14 0c-1 0-2 1-2 2s1 2 2 2 2-1 2-2-1-2-2-2zm-7 0c-1 0-2 1-2 2s1 2 2 2 2-1 2-2-1-2-2-2z" />,
  );
};
IconMoreHorizontalOutline.propTypes = {
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
