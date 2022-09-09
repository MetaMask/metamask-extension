import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconSnapsMobileFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M337 51H166C91 51 47 96 47 170v172c0 74 44 119 119 119h171c75 0 119-45 119-119V170c1-74-44-119-119-119zm-94 303c0 6-3 12-9 15-2 2-6 3-9 3-2 0-5-1-8-2l-72-36c-10-5-16-16-16-27v-68c0-6 3-12 8-15s12-4 17-1l72 36c10 5 17 16 17 27v68zm-4-109-78-42c-5-3-9-9-9-16 0-6 4-13 9-16l78-41c8-4 17-4 26 0l77 41c5 3 9 9 9 16s-4 13-9 16l-77 42c-5 2-9 3-14 3-4 0-8-1-12-3zm136 62c0 11-7 22-17 27l-72 36c-3 1-5 2-8 2s-7-1-9-3c-6-3-9-9-9-15v-68c0-11 7-22 17-27l72-36c5-3 12-2 17 1s9 9 9 15z" />,
  );
};
IconSnapsMobileFilled.propTypes = {
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
