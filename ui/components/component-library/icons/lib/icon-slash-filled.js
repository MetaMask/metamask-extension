import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconSlashFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M406 123 119 410c0 1-1 1-1 1-8-7-15-14-22-21-31-36-49-83-49-134 0-113 91-205 205-205 51 0 97 19 133 50 8 7 15 14 22 21l-1 1zm50 133c0 112-92 205-204 205-31 0-60-7-87-19-12-6-15-23-5-33l244-244c10-10 27-8 33 5 13 26 19 55 19 86zm-4-200c-7-6-17-6-23 0L51 434c-6 6-6 16 0 22 3 3 7 5 11 5 5 0 8-2 12-5L452 78c6-6 6-16 0-22z" />,
  );
};
IconSlashFilled.propTypes = {
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
