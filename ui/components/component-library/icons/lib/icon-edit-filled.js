import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconEditFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M436 461H67c-8 0-15-7-15-16 0-8 7-15 15-15h369c8 0 15 7 15 15 0 9-7 16-15 16zM395 82c-39-40-78-41-119 0l-25 24c-2 2-3 6-2 8 16 55 59 98 113 114h3c2 0 4-1 6-2l24-25c21-20 30-40 30-59 1-21-9-40-30-60zm-70 164c-5-2-11-5-17-9-4-2-9-5-13-8-3-2-7-6-11-9-1 0-2-1-4-3-7-6-14-13-21-21-1-1-2-2-3-4-2-3-6-7-9-11-2-3-5-8-8-12-3-6-6-12-9-17 0-1 0-2-1-3-3-7-12-9-17-4L95 263c-3 2-5 8-6 11l-11 78c-2 14 2 27 10 36 8 7 18 11 29 11h7l79-11c4-1 9-3 11-6l117-117c6-6 4-15-3-18-1 0-2 0-3-1z" />,
  );
};
IconEditFilled.propTypes = {
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
