import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconDarkFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M447 336c-4-5-13-14-36-10-12 3-25 4-38 3-48-2-91-24-121-58-27-29-43-68-43-110 0-23 4-46 13-67s3-32-2-36c-4-5-15-11-37-2C99 91 47 175 53 265c7 84 66 157 145 184 18 6 38 10 59 11 3 0 6 1 10 1 68 0 133-33 173-88 14-19 10-31 7-37z" />,
  );
};
IconDarkFilled.propTypes = {
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
