import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconCopyFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M333 274v86c0 72-28 101-100 101h-86c-72 0-100-29-100-101v-86c0-71 28-100 100-100h86c72 0 100 29 100 100zm23-223h-86c-63 0-93 23-99 77-1 11 8 20 20 20h42c86 0 126 40 126 126v43c0 11 9 21 21 19 54-6 76-35 76-98v-86c0-72-28-101-100-101z" />,
  );
};
IconCopyFilled.propTypes = {
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
