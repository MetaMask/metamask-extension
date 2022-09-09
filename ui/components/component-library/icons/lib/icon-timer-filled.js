import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconTimerFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="m362 331-83-75h-55l-83 75c-23 21-31 53-20 82 12 29 39 48 70 48h121c31 0 58-19 69-48 12-29 4-61-19-82zm-73 51h-75c-8 0-14-7-14-14 0-8 7-14 14-14h75c8 0 14 6 14 14 0 7-7 14-14 14zm93-283c-12-29-39-48-70-48H191c-31 0-58 19-70 48-11 29-3 61 20 82l83 75h55l83-75c23-21 31-53 20-82zm-93 59h-75c-8 0-14-6-14-14 0-7 7-14 14-14h75c8 0 14 7 14 14 0 8-7 14-14 14z" />,
  );
};
IconTimerFilled.propTypes = {
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
