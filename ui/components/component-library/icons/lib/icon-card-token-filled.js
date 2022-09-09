import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconCardTokenFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M252 332v2c0 6-5 10-11 10H57c-6 0-10-4-10-10v-2c0-36 9-45 45-45h114c37 0 46 9 46 45zM57 365c-6 0-10 4-10 10v41c0 36 9 45 45 45h114c37 0 46-9 46-45v-41c0-6-5-10-11-10zM22 15c0 4-3 7-7 7l1-2M2 9c0-4 3-7 7-7L8 4m256 130 65-28c3-2 6-2 9 0l65 28c6 3 11-4 7-9l-68-83c-5-6-13-6-17 0l-68 83c-4 5 1 12 7 9zm0 80 65 29c3 1 6 1 9 0l65-29c6-3 11 4 7 9l-68 83c-5 6-12 6-17 0l-68-83c-4-5 1-12 7-9zm66-74-56 28c-5 2-5 10 0 12l56 28c2 1 5 1 7 0l56-28c5-2 5-10 0-12l-56-28c-2-1-5-1-7 0z" />,
  );
};
IconCardTokenFilled.propTypes = {
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
