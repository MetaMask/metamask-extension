import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconMonitorFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M366 51H137c-50 0-90 41-90 91v137c0 50 40 90 90 90h79c11 0 20 9 20 21v19c0 12-9 21-20 21h-50c-8 0-15 7-15 15 0 9 7 16 15 16h171c9 0 16-7 16-16 0-8-7-15-16-15h-49c-11 0-21-9-21-20v-20c0-12 10-21 21-21h78c50 0 90-40 90-90V142c0-50-40-91-90-91z" />,
  );
};
IconMonitorFilled.propTypes = {
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
