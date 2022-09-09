import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconFlashSlashFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M452 56c-7-6-17-6-23 0L51 434c-6 6-6 16 0 22 4 3 7 5 11 5 5 0 8-2 12-5L452 78c6-6 6-16 0-22zM309 82v116L194 314v-32h-64c-28 0-36-17-17-39L268 67c23-26 41-19 41 15zm81 187L235 445c-23 26-41 19-41-15v-55l145-145h34c28 0 36 17 17 39z" />,
  );
};
IconFlashSlashFilled.propTypes = {
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
