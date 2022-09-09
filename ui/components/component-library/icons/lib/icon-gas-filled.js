import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconGasFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="m463 201-41-20c-7-4-17-1-20 7-4 7-1 17 6 20l33 16v99h-77V113c0-41-27-62-61-62H139c-34 0-62 21-62 62v332H47c-9 0-16 7-16 16 0 8 7 15 16 15h348c8 0 15-7 15-15 0-9-7-16-15-16h-31v-92h92c9 0 16-7 16-15V215c0-6-4-11-9-14zm-334-50c0-28 17-38 38-38h107c22 0 39 10 39 38v26c0 28-17 38-39 38H167c-21 0-38-10-38-39zm10 110h61c9 0 16 7 16 15 0 9-7 16-16 16h-61c-9 0-15-7-15-16 0-8 6-15 15-15z" />,
  );
};
IconGasFilled.propTypes = {
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
