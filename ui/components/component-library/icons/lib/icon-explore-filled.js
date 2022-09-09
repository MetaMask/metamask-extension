import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconExploreFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M262 469c118 0 213-95 213-213S380 43 262 43 49 138 49 256s95 213 213 213zm85-361c18-4 36 1 49 14s18 31 14 49l-37 146c-6 25-25 44-50 50l-146 37c-4 1-9 1-13 1-13 0-26-5-36-15-13-13-18-31-14-49l37-146c6-25 25-44 50-50zM204 256c0 32 26 58 58 58s58-26 58-58-26-58-58-58-58 26-58 58z" />,
  );
};
IconExploreFilled.propTypes = {
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
