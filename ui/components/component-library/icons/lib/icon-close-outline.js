import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconCloseOutline = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M94 88c4-4 11-4 14 0l322 322c4 3 4 10 0 14s-11 4-14 0L94 102c-4-3-4-10 0-14zm336 0c4 4 4 11 0 14L108 424c-3 4-10 4-14 0s-4-11 0-14L416 88c3-4 10-4 14 0zm-322 0-3 4zm-14 0 4 4zm336 322-4 3zm-14 14 3-4zM94 102l4-3zm336 0 3 4zm0-14-4 4zM108 424l-3-4zm-14-14-4-4zM416 88l3 4zm-304-3c-6-6-16-6-22 0l8 7c2-2 5-2 7 0zm321 321L112 85l-7 7 321 321zm0 21c6-6 6-15 0-21l-7 7c2 2 2 5 0 7zm-21 0c6 7 15 7 21 0l-7-7c-2 2-5 2-7 0zM90 106l322 321 7-7L98 99zm0-21c-6 6-6 15 0 21l8-7c-2-2-2-5 0-7zm343 21c6-6 6-15 0-21l-7 7c2 2 2 5 0 7zM112 427l321-321-7-7-321 321zm-22 0c6 7 16 7 22 0l-7-7c-2 2-5 2-7 0zm0-21c-6 6-6 15 0 21l8-7c-2-2-2-5 0-7zM412 85 90 406l8 7L419 92zm21 0c-6-6-15-6-21 0l7 7c2-2 5-2 7 0z" />,
  );
};
IconCloseOutline.propTypes = {
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
