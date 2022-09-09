import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconLink2Outline = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M190 451c-34 0-68-13-94-39-52-52-52-137 0-189 6-5 15-5 21 0 6 6 6 16 0 22-40 40-40 105 0 145s105 40 145 0c19-19 30-45 30-73 0-27-11-53-30-72-6-6-6-16 0-22s16-6 22 0c25 25 39 59 39 94 0 36-14 69-39 95-26 26-60 39-94 39zm206-151c-4 0-7-1-11-4-5-6-5-16 0-22 42-42 42-110 0-152s-110-42-152 0c-20 20-31 47-31 76s11 56 31 76c6 6 6 16 0 22-5 6-15 6-21 0-26-26-41-61-41-98s15-72 41-98c54-54 141-54 195 0s54 142 0 196c-3 3-7 4-11 4z" />,
  );
};
IconLink2Outline.propTypes = {
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
