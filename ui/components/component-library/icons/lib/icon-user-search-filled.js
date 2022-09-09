import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconUserSearchFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M333 154c0 56-45 102-102 102s-102-46-102-102c0-57 45-103 102-103s102 46 102 103zM47 451c0-85 83-154 186-154 29 0 57 6 81 15-10 15-16 32-16 52 0 48 39 87 87 87 12 0 23-3 34-7v7c0 5-4 10-10 10H57c-6 0-10-5-10-10zm420-87c0 45-37 81-82 81-46 0-82-36-82-81 0-46 36-82 82-82 45 0 82 36 82 82zm-58 24c3-2 7-2 10 0l11 12c3 2 3 7 0 9-2 3-6 3-9 0l-12-12c-2-2-2-6 0-9zm10-28c0 21-17 37-38 37s-37-16-37-37 16-37 37-37 38 16 38 37z" />,
  );
};
IconUserSearchFilled.propTypes = {
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
