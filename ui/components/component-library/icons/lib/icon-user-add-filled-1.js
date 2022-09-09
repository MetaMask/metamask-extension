import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconUserAddFilled1 = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M333 154c0 56-45 102-102 102s-102-46-102-102c0-57 45-103 102-103s102 46 102 103zM47 451c0-85 83-154 186-154 29 0 57 6 81 15-10 15-16 32-16 52 0 48 39 87 87 87 12 0 23-3 34-7v7c0 5-4 10-10 10H57c-6 0-10-5-10-10zm420-87c0 45-37 81-82 81-46 0-82-36-82-81 0-46 36-82 82-82 45 0 82 36 82 82zm-86-24-31 32c-2 2-4 5-4 7l-2 16c-1 6 3 10 9 9l16-2c2 0 6-2 7-4l32-31c1 0 2 1 3 1 3 1 7-1 8-4 0-2-1-5-2-6l2-2c7-7 11-16 0-27-11-10-19-7-27 0l-2 2c-1-1-3-2-6-1s-5 4-4 7c1 1 1 2 1 3z" />,
  );
};
IconUserAddFilled1.propTypes = {
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
