import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconScanBarcodeFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M47 210c-9 0-16-7-16-15v-52C31 84 80 36 139 36h51c8 0 15 7 15 15 0 9-7 16-15 16h-51c-43 0-77 34-77 76v52c0 8-7 15-15 15zm409 0c-8 0-15-7-15-15v-52c0-42-34-76-77-76h-51c-8 0-15-7-15-16 0-8 7-15 15-15h51c59 0 108 48 108 107v52c0 8-7 15-16 15zm-92 266h-31c-8 0-15-7-15-15 0-9 7-16 15-16h31c43 0 77-34 77-76v-31c0-8 7-15 15-15 9 0 16 7 16 15v31c0 59-49 107-108 107zm-174 0h-51c-59 0-108-48-108-107v-52c0-8 7-15 16-15 8 0 15 7 15 15v52c0 42 34 76 77 76h51c8 0 15 7 15 16 0 8-7 15-15 15zm0-358h-41c-23 0-36 12-36 36v41c0 23 13 35 36 35h41c23 0 36-12 36-35v-41c0-24-13-36-36-36zm164 0h-41c-23 0-36 12-36 36v41c0 23 13 35 36 35h41c23 0 36-12 36-35v-41c0-24-13-36-36-36zM190 282h-41c-23 0-36 12-36 35v41c0 24 13 36 36 36h41c23 0 36-12 36-36v-41c0-23-13-35-36-35zm164 0h-41c-23 0-36 12-36 35v41c0 24 13 36 36 36h41c23 0 36-12 36-36v-41c0-23-13-35-36-35z" />,
  );
};
IconScanBarcodeFilled.propTypes = {
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
