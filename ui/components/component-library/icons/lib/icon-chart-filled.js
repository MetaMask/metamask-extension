import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconChartFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M436 476H67c-8 0-15-7-15-15 0-9 7-16 15-16h369c8 0 15 7 15 16 0 8-7 15-15 15zM120 182H88c-12 0-21 9-21 20v177c0 11 9 20 21 20h32c12 0 21-9 21-20V202c0-11-9-20-21-20zm148-65h-33c-11 0-20 9-20 20v242c0 11 9 20 20 20h33c11 0 20-9 20-20V137c0-11-9-20-20-20zm147-66h-32c-12 0-21 9-21 21v307c0 11 9 20 21 20h32c12 0 21-9 21-20V72c0-12-9-21-21-21z" />,
  );
};
IconChartFilled.propTypes = {
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
