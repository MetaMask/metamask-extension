import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconReceivedOutline = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M108 384c-4 0-8-1-11-5-6-5-6-15 0-21L384 71c6-6 16-6 22 0s6 16 0 22L119 379c-3 4-7 5-11 5zm210 0H108c-8 0-15-7-15-15V158c0-8 7-15 15-15 9 0 16 7 16 15v195h194c9 0 16 7 16 16 0 8-7 15-16 15zm108 92H77c-8 0-15-7-15-15 0-9 7-16 15-16h349c8 0 15 7 15 16 0 8-7 15-15 15z" />,
  );
};
IconReceivedOutline.propTypes = {
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
