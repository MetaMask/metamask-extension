import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconMobileFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M338 51H165c-57 0-77 21-77 78v254c0 57 20 78 77 78h173c57 0 77-21 77-78V129c0-57-20-78-77-78zm-86 355c-20 0-36-17-36-36 0-20 16-36 36-36 19 0 35 16 35 36 0 19-16 36-35 36zm40-268h-81c-9 0-16-7-16-15 0-9 7-15 16-15h81c9 0 16 6 16 15 0 8-7 15-16 15z" />,
  );
};
IconMobileFilled.propTypes = {
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
