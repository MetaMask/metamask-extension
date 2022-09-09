import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconWarningFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M252 51C139 51 47 143 47 256s92 205 205 205c112 0 204-92 204-205S364 51 252 51zm-16 123c0-8 7-15 16-15 8 0 15 7 15 15v102c0 9-7 16-15 16-9 0-16-7-16-16zm34 172c-1 2-2 4-4 6s-4 4-7 5c-2 1-5 1-7 1-3 0-6 0-8-1-3-1-5-3-7-5s-3-4-4-6c-1-3-2-5-2-8s1-5 2-8c1-2 2-5 4-7 2-1 4-3 7-4 5-2 10-2 15 0 3 1 5 3 7 4 2 2 3 5 4 7 1 3 2 5 2 8s-1 5-2 8z" />,
  );
};
IconWarningFilled.propTypes = {
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
