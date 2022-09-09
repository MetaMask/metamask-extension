import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconMoreVerticalOutline = ({
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
    <path d="M211 399c0 23 18 41 41 41 22 0 40-18 40-41 0-22-18-41-40-41-23 0-41 19-41 41zm0-286c0 22 18 41 41 41 22 0 40-19 40-41 0-23-18-41-40-41-23 0-41 18-41 41zm0 143c0 23 18 41 41 41 22 0 40-18 40-41s-18-41-40-41c-23 0-41 18-41 41zM10 19c0 1 1 2 2 2s2-1 2-2-1-2-2-2-2 1-2 2zm0-14c0 1 1 2 2 2s2-1 2-2-1-2-2-2-2 1-2 2zm0 7c0 1 1 2 2 2s2-1 2-2-1-2-2-2-2 1-2 2z" />,
  );
};
IconMoreVerticalOutline.propTypes = {
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
