import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconCodeCircleFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M252 51C138 51 47 143 47 256s91 205 205 205c113 0 204-92 204-205S365 51 252 51zm-72 235c6 6 6 16 0 22-3 3-7 4-10 4-4 0-8-1-11-4l-41-41c-6-6-6-16 0-22l41-41c6-6 16-6 21 0 6 6 6 16 0 22l-30 30zm106-72-41 96c-2 6-8 9-14 9-2 0-4 0-6-1-8-3-11-12-8-20l41-96c3-8 12-12 20-8 8 3 11 12 8 20zm99 53-41 41c-3 3-7 4-11 4-3 0-7-1-10-4-6-6-6-16 0-22l30-30-30-30c-6-6-6-16 0-22s15-6 21 0l41 41c6 6 6 16 0 22z" />,
  );
};
IconCodeCircleFilled.propTypes = {
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
