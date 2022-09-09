import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconNotificationFilled = ({
  size,
  color,
  className,
  ...props
}) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="m402 307-21-34c-4-8-8-22-8-30v-52c0-48-28-90-69-109-11-19-30-31-53-31-22 0-42 12-53 31-40 20-67 61-67 109v52c0 8-4 22-9 30l-20 34c-8 14-10 29-5 43s16 24 32 29c39 14 81 20 123 20s83-6 123-20c15-4 26-15 31-29s4-30-4-43zm-93 113c-8 24-31 41-57 41-17 0-33-7-44-18-6-7-11-15-14-23 2 0 5 0 8 1 5 0 10 1 14 2 12 1 24 1 36 1s23 0 35-1c4-1 8-1 12-2 4 0 7-1 10-1z" />,
  );
};
IconNotificationFilled.propTypes = {
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
