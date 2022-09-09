import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconUserAddFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M333 154c0 56-45 102-102 102s-102-46-102-102c0-57 45-103 102-103s102 46 102 103zM47 451c0-85 83-154 186-154 27 0 54 5 77 14-11 14-17 33-17 52 0 49 38 88 87 88 14 0 27-4 39-10v10c0 5-4 10-10 10H57c-6 0-10-5-10-10zm332-6c46 0 82-36 82-82 0-45-36-82-82-82-45 0-81 37-81 82 0 46 36 82 81 82zm11-112c0-6-5-10-11-10-5 0-10 4-10 10v19h-20c-6 0-10 5-10 11 0 5 4 10 10 10h20v21c0 6 5 10 10 10 6 0 11-4 11-10v-21h20c6 0 10-5 10-10 0-6-4-11-10-11h-20z" />,
  );
};
IconUserAddFilled.propTypes = {
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
