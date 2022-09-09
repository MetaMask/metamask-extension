import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconUserRemoveFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M333 154c0 56-45 102-102 102s-102-46-102-102c0-57 45-103 102-103s102 46 102 103zM47 451c0-85 83-154 186-154 29 0 57 6 81 15-10 15-16 32-16 52 0 48 39 87 87 87 12 0 23-3 34-7v7c0 5-4 10-10 10H57c-6 0-10-5-10-10zm338-6c45 0 82-36 82-81 0-46-37-82-82-82-46 0-82 36-82 82 0 45 36 81 82 81zm29-96c4-4 4-10 0-14s-11-4-15 0l-14 14-14-15c-4-4-11-4-15 0s-4 11 0 15l15 14-15 15c-4 4-4 10 0 14s10 4 14 0l15-15 14 15c4 4 11 4 15 0s4-11 0-15l-14-14z" />,
  );
};
IconUserRemoveFilled.propTypes = {
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
