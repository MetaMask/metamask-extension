import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconLockSlashFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M285 332c0 19-15 34-33 34-14 0-25-8-30-19l44-45c11 6 19 17 19 30zM452 56c-7-6-17-6-23 0l-57 57c-16-41-56-62-120-62-116 0-129 74-129 129v25h1c-58 7-77 36-77 108v38c0 33 4 57 13 74l-9 9c-6 6-6 16 0 22 3 3 7 5 11 5 5 0 8-2 12-5L452 78c6-6 6-16 0-22zM156 204h-4v-24c0-60 17-100 100-100 69 0 91 26 97 56l-67 68zm300 109v38c0 84-25 110-109 110H158c-19 0-28-22-15-35l58-58c1 2 3 4 5 6 14 15 35 24 59 19 2-1 4-1 5-2 2 0 4-1 5-2 5-1 8-4 12-6 2-1 3-2 4-3 3-3 6-5 8-8 1-2 2-3 3-4 3-4 5-8 6-12 1-1 2-3 2-5 1-2 2-4 2-6 5-23-3-44-19-59-2-1-4-3-6-4l64-64 3-3c8-7 19-10 29-9 2 0 4 0 6 1 3 0 7 1 10 2s7 2 10 3c6 2 11 5 15 8 5 3 9 7 13 11 1 2 3 5 5 7 1 2 2 5 4 8 1 2 2 5 3 8s2 7 3 11c1 3 1 6 2 10 0 3 1 6 1 9 1 9 1 19 1 29z" />,
  );
};
IconLockSlashFilled.propTypes = {
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
