import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconSpeedometerFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M57 329v44c0 5 2 9 4 12 3 2 7 4 11 4h359c4 0 8-2 11-4 2-3 4-7 4-12v-47c0-26-5-53-15-78-10-24-24-47-42-66s-40-34-64-44c-23-10-49-15-74-15-108 0-194 93-194 206zm317-22c12 0 21-9 21-20 0-12-9-21-21-21-11 0-20 9-20 21 0 11 9 20 20 20zm-235-20c0 11-9 20-21 20-11 0-20-9-20-20 0-12 9-21 20-21 12 0 21 9 21 21zm99-82c12 0 21-9 21-21 0-11-9-20-21-20-11 0-20 9-20 20 0 12 9 21 20 21zm117 9c6 6 6 16 0 22l-76 76v5c0 17-14 31-31 31s-30-14-30-31 13-30 30-30c4 0 8 0 11 1l74-74c6-6 16-6 22 0z" />,
  );
};
IconSpeedometerFilled.propTypes = {
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
