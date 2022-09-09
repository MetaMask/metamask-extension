import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconUserCircleFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M456 256c0-113-92-205-204-205-113 0-205 92-205 205 0 59 25 113 66 150v1c2 2 4 3 6 5 1 1 2 2 4 3 3 3 7 6 11 9 2 1 3 2 4 3 4 2 8 5 13 7 1 1 3 2 4 3 4 2 9 4 13 6 2 1 3 2 5 2 5 2 9 4 14 5 1 1 3 1 5 2 4 1 9 2 14 4 2 0 3 1 5 1 6 1 11 2 17 2 1 0 2 1 3 1 7 0 14 1 21 1 6 0 13-1 20-1 1 0 2 0 3-1 6 0 11-1 17-2 2 0 3-1 5-1 4-2 10-3 14-4 2-1 4-1 5-2 5-1 9-3 14-5 1 0 3-1 5-2 4-2 8-4 13-6 1-1 3-2 4-3 4-2 8-5 12-7 2-1 3-2 4-3 5-3 8-6 12-9 1-1 2-2 4-3 2-2 4-3 6-5v-1c41-37 66-91 66-150zM353 358c-56-37-147-37-203 0-9 6-16 13-22 20-31-31-51-74-51-122 0-96 78-174 175-174 96 0 174 78 174 174 0 48-20 91-51 122-6-7-13-14-22-20zM252 152c-43 0-77 35-77 77s32 75 75 77h4c42-2 74-35 74-77s-34-77-76-77z" />,
  );
};
IconUserCircleFilled.propTypes = {
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
