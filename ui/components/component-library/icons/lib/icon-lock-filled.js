import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconLockFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M252 366c18 0 33-15 33-34 0-18-15-33-33-33-19 0-34 15-34 33 0 19 15 34 34 34zm128-161v-25c0-55-13-129-128-129-116 0-129 74-129 129v25c-57 8-76 37-76 108v38c0 84 25 110 109 110h191c84 0 109-26 109-110v-38c0-71-19-100-76-108zM252 394c-35 0-62-28-62-62s28-62 62-62 61 28 61 62-27 62-61 62zm-96-190h-4v-24c0-60 17-100 100-100 82 0 99 40 99 100v24H156z" />,
  );
};
IconLockFilled.propTypes = {
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
