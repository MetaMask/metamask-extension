import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconFilterOutline = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M436 169H67c-8 0-15-7-15-15 0-9 7-16 15-16h369c8 0 15 7 15 16 0 8-7 15-15 15zm-62 102H129c-9 0-16-7-16-15s7-15 16-15h245c9 0 16 7 16 15s-7 15-16 15zm-82 103h-81c-9 0-16-7-16-16 0-8 7-15 16-15h81c9 0 16 7 16 15 0 9-7 16-16 16z" />,
  );
};
IconFilterOutline.propTypes = {
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
