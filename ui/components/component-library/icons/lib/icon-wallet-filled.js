import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconWalletFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M456 235v42c0 11-9 21-20 21h-40c-22 0-43-16-45-38-1-13 4-25 13-34 7-7 18-12 29-12h43c11 0 20 10 20 21zm-31 94h-29c-39 0-72-30-75-67-2-21 6-42 21-58 13-13 32-21 51-21h32c6 0 11-5 10-11-4-49-37-83-86-89-5-1-10-1-16-1H149c-6 0-11 0-16 1-53 7-86 46-86 101v144c0 56 46 102 102 102h184c58 0 97-36 102-90 1-6-4-11-10-11zM272 210H149c-8 0-15-7-15-15 0-9 7-16 15-16h123c8 0 15 7 15 16 0 8-7 15-15 15z" />,
  );
};
IconWalletFilled.propTypes = {
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
