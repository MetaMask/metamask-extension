import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconGraphFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M450 153c-14-45-51-82-95-95-34-10-57-9-73 3-20 15-22 41-22 59v51c0 51 23 76 68 76h59c18 0 45-2 59-21 13-16 14-40 4-73zm-57 131c-5-6-13-10-21-10h-73c-36 0-66-29-66-65v-73c0-8-3-16-9-22-6-5-14-7-22-6-48 6-93 32-121 72-30 40-40 89-31 137 13 71 70 127 140 141 12 2 23 3 34 3 37 0 73-12 103-34 40-29 67-73 73-121 1-8-2-16-7-22z" />,
  );
};
IconGraphFilled.propTypes = {
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
