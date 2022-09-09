import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconSnapsPlusFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M351 115 241 56c-12-6-26-6-37 0L94 115c-8 5-14 13-14 23 0 9 5 18 14 22l110 60c6 3 12 4 18 4 7 0 13-1 19-4l110-60c8-4 13-13 13-22 0-10-5-18-13-23zM186 240 83 189c-8-4-17-3-24 1-8 5-12 13-12 22v96c0 17 9 32 24 40l103 51c3 2 7 3 11 3s9-2 13-4c7-5 12-13 12-21v-97c0-17-10-32-24-40zm212-28v48c-10-3-20-4-29-4-27 0-53 9-73 25-28 22-44 56-44 92 0 9 1 19 3 28-3 0-6-1-8-3-8-5-12-13-12-21v-97c0-17 9-32 24-40l102-51c8-4 17-3 25 1 7 5 12 13 12 22zm39 106h-1c0-2-1-3-2-4h-1c-16-18-39-29-64-29s-47 10-63 27c-16 15-25 37-25 61 0 16 4 32 12 45 5 7 10 14 16 20h1l3 3h1c15 13 34 20 55 20 32 0 59-17 75-43 4-7 8-16 10-25 2-6 2-13 2-20 0-21-7-40-19-55zm-36 69h-18v19c0 8-6 15-14 15s-15-7-15-15v-19h-18c-8 0-15-6-15-14s7-15 15-15h18v-18c0-8 7-14 15-14s14 6 14 14v18h18c8 0 15 7 15 15s-6 14-15 14z" />,
  );
};
IconSnapsPlusFilled.propTypes = {
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
