import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconWalletMoneyFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M435 213h-42c-6 1-12 2-17 4-5 3-10 6-14 11-4 4-6 9-8 14-2 6-3 11-2 17 1 11 6 21 14 28s18 11 29 11h41c5 0 10-3 14-6 4-4 6-9 6-15v-43c0-2 0-5-1-8-1-2-3-5-5-7s-4-3-7-4c-2-1-5-2-8-2zm-11 115h-29c-19 1-37-6-51-18-13-13-22-30-24-48-1-11 0-22 4-32s9-19 17-26c7-7 15-12 23-16 9-3 19-5 28-5h36l3-3c1-1 2-2 2-3 1-2 1-3 1-5-1-22-10-44-26-61-16-16-37-27-60-29H149c-6 0-11 1-17 1-24 3-46 15-62 33-16 19-25 43-23 68v143c0 28 11 54 30 73s45 30 72 30h184c13 1 25-1 37-5s23-11 33-19c9-8 17-19 23-30 5-12 8-24 9-37 0-1 0-3-1-4 0-1-1-3-2-4s-2-2-3-2c-2-1-3-1-5-1zm-188 15c-1 21-11 40-26 54-16 14-36 21-57 20-21 1-42-6-57-20-16-14-25-33-27-54v-98c1-10 3-20 7-29 5-9 11-17 19-24 8-8 18-14 29-17 9-3 19-5 29-5 21 0 42 7 58 21 8 6 14 15 19 24 4 9 6 20 6 30zM90 292v9c0 29 27 50 63 50 35 0 62-20 62-50v-9c-17 16-39 24-63 24-23 0-45-8-62-24zm39-97c-11 3-21 10-28 19s-11 20-11 31v5c0 6 3 12 6 18 6 9 15 16 25 21 10 4 21 7 31 6 11 1 22-2 32-6 10-5 19-12 25-21 4-7 6-15 6-23 0-7-1-14-5-21-3-6-7-12-13-16-9-8-21-13-32-15-12-2-25-2-36 2zM90 349c3 14 11 26 23 35 11 9 25 13 40 13 14 0 28-4 40-13 11-8 19-21 22-35-17 15-39 23-62 23s-46-8-63-23z" />,
  );
};
IconWalletMoneyFilled.propTypes = {
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
