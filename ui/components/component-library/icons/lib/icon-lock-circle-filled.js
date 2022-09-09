import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconLockCircleFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M252 169c-39 0-47 16-47 46v13h93v-13c0-30-8-46-46-46zm0 150c12 0 22-10 22-22s-10-23-22-23c-13 0-23 11-23 23s10 22 23 22zm0-268C138 51 47 143 47 256s91 205 205 205c113 0 204-92 204-205S365 51 252 51zm110 256c0 45-14 59-59 59H200c-45 0-59-14-59-59v-20c0-35 9-51 34-57v-15c0-19 0-77 77-77 76 0 76 58 76 77v15c25 6 34 22 34 57z" />,
  );
};
IconLockCircleFilled.propTypes = {
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
