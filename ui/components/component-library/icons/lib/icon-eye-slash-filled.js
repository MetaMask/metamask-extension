import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconEyeSlashFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M441 198c-6-9-12-18-18-26-8-10-22-11-31-2l-61 61c4 14 5 30 1 46-7 29-31 52-60 59-16 4-31 3-45-1l-50 50c-10 10-7 28 7 34 21 8 44 13 68 13 36 0 71-11 104-31s62-51 86-89c20-31 19-83-1-114zm-148 17-83 82c-10-10-17-25-17-41 0-32 26-59 59-59 15 0 30 7 41 18zm87-87-70 69c-15-15-36-24-58-24-46 0-83 37-83 83 0 23 9 44 24 59l-69 69c-23-18-44-42-62-70-20-32-20-84 0-116 24-38 53-67 85-87 33-20 68-31 105-31 45 0 89 17 128 48zm-70 128c0 32-26 59-58 59-2 0-3 0-4-1l62-61v3zM452 56c-7-6-17-6-23 0L51 434c-6 6-6 16 0 22 3 3 7 5 11 5 5 0 8-2 12-5L452 78c6-6 6-16 0-22z" />,
  );
};
IconEyeSlashFilled.propTypes = {
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
