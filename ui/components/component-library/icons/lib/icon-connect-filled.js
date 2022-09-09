import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconConnectFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M252 305c26 0 48-22 48-49s-22-49-48-49c-27 0-49 22-49 49s22 49 49 49zm163 89c-3 0-6-1-9-3-7-5-8-15-3-21 25-33 38-73 38-114s-13-81-38-114c-5-6-4-16 3-21s17-4 22 3c29 38 44 84 44 132s-15 94-44 132c-3 4-8 6-13 6zm-327 0c-5 0-10-2-13-6-28-38-44-84-44-132s16-94 44-132c6-7 15-8 22-3s8 15 3 21c-25 33-38 73-38 114s13 81 38 114c5 6 4 16-3 21-3 2-6 3-9 3zm262-49c-3 0-7-1-9-3-7-5-9-15-3-21 14-19 21-41 21-65s-7-46-21-65c-6-6-4-16 3-21 6-5 16-4 21 3 18 24 28 53 28 83s-10 59-28 83c-3 4-7 6-12 6zm-197 0c-4 0-9-2-12-6-18-24-28-53-28-83s10-59 28-83c5-7 15-8 21-3 7 5 9 15 4 21-15 19-22 41-22 65s7 46 22 65c5 6 3 16-4 21-2 2-6 3-9 3z" />,
  );
};
IconConnectFilled.propTypes = {
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
