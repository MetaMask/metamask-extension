import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconCardPosFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M456 445c0 9-7 16-15 16H62c-8 0-15-7-15-16 0-8 7-15 15-15h379c8 0 15 7 15 15zM321 103 101 323c-8 8-22 8-30 0-29-29-29-75 0-104L217 73c29-29 75-29 104 0 8 8 8 22 0 30zm111 81-62-62c-9-9-22-9-30 0L120 342c-9 8-9 21 0 30l62 62c29 29 75 29 104 0l146-146c29-29 29-75 0-104zM267 369l-25 25c-5 5-13 5-19 0-5-5-5-13 0-19l25-25c5-5 14-5 19 0s5 14 0 19zm81-81-50 50c-5 5-13 5-18 0-6-5-6-14 0-19l50-50c5-5 13-5 18 0 6 5 6 14 0 19z" />,
  );
};
IconCardPosFilled.propTypes = {
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
