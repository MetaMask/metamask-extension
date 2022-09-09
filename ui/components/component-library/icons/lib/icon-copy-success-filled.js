import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconCopySuccessFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M356 51h-86c-63 0-93 23-99 77-1 11 8 20 20 20h42c86 0 126 40 126 126v43c0 11 9 21 21 19 54-6 76-35 76-98v-86c0-72-28-101-100-101zM233 174h-86c-72 0-100 29-100 100v86c0 72 28 101 100 101h86c72 0 100-29 100-101v-86c0-71-28-100-100-100zm24 116-76 76c-2 3-6 4-10 4s-8-1-10-4l-39-38c-5-6-5-15 0-21 6-6 15-6 21 0l28 28 66-66c5-6 15-6 20 0 6 6 6 15 0 21z" />,
  );
};
IconCopySuccessFilled.propTypes = {
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
