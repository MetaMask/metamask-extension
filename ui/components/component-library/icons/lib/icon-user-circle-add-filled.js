import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconUserCircleAddFilled = ({
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
    <path d="M436 77c-14-16-35-26-58-26-22 0-41 9-56 24-8 8-14 18-18 30-2 7-4 16-4 24 0 15 4 29 12 40 3 7 9 13 14 18 14 13 32 20 52 20 9 0 17-1 25-4 18-6 33-18 42-34 4-6 7-14 9-22 2-5 2-12 2-18 0-20-7-38-20-52zm-29 66h-14v16c0 8-7 14-15 14s-14-6-14-14v-16h-15c-8 0-14-6-14-14s6-15 14-15h15v-14c0-8 6-14 14-14s15 6 15 14v14h14c8 0 15 7 15 15s-6 14-15 14zm30 123c0-26-5-50-14-73-6 4-13 8-20 10-2 1-5 2-7 2 7 19 12 39 12 61 0 45-19 86-48 116-6-7-13-14-22-19-53-36-139-36-193 0-8 5-15 12-21 19-30-30-48-71-48-116 0-92 74-166 166-166 21 0 42 4 60 11 1-2 1-4 2-6 3-8 6-14 10-20-22-9-47-14-72-14-108 0-195 87-195 195 0 56 24 107 63 143 1 2 4 4 6 6 1 1 2 2 3 2 4 3 7 6 11 9 2 1 3 1 4 2 4 3 8 5 12 7 1 1 3 2 4 3l12 6c2 1 4 1 5 2 4 2 9 3 13 5 1 0 3 1 5 1 4 2 9 3 14 4 1 0 2 1 4 1 5 1 11 2 17 2 0 0 1 1 2 1 7 0 13 1 20 1 6 0 13-1 19-1 1 0 2 0 3-1 5 0 11-1 16-2 2 0 3-1 5-1 4-1 9-2 14-4 1 0 3-1 4-1 5-2 9-3 13-5 2-1 3-1 5-2l12-6c2-1 3-2 5-3 3-2 7-4 11-7 2 0 3-1 4-2 4-3 8-6 11-9 1-1 2-2 4-2l6-6c38-36 63-87 63-143zm-195-99c-41 0-73 33-73 73s31 72 72 73h3c40-1 71-33 71-73s-33-73-73-73z" />,
  );
};
IconUserCircleAddFilled.propTypes = {
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
