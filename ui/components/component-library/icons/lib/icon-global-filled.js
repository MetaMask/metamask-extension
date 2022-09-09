import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconGlobalFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M162 438s-1 1-2 1c-39-20-72-52-92-92 0-1 1-2 1-2 25 7 51 13 76 17 5 26 10 51 17 76zm273-91c-21 41-54 74-96 94 8-26 15-52 19-79 26-4 51-10 76-17 0 1 1 2 1 2zm1-179c-26-8-52-14-78-18-4-27-11-53-19-79 43 21 77 55 97 97zM162 74c-7 25-12 50-17 76-26 4-52 10-78 18 20-41 53-75 93-95 1 0 2 1 2 1zm161 71c-48-5-95-5-143 0 5-28 12-56 21-83v-4c17-4 33-7 51-7 17 0 34 3 49 7 1 1 1 2 1 4 9 27 16 55 21 83zM141 327c-29-5-56-11-83-20-2-1-3-1-5-1-4-16-6-33-6-50s2-34 6-50c2 0 3 0 5-1 27-9 54-15 83-20-5 47-5 95 0 142zm315-71c0 17-2 34-6 50-2 0-3 0-5 1-27 9-55 15-83 20 6-47 6-95 0-142 28 5 56 11 83 20 2 1 3 1 5 1 4 16 6 33 6 50zM323 367c-5 28-12 56-21 83 0 2 0 3-1 4-15 4-32 7-49 7-18 0-34-3-51-7v-4c-9-27-16-55-21-83 24 2 48 4 72 4 23 0 47-2 71-4zm6-34c-52 7-103 7-155 0-6-51-6-103 0-154 52-7 103-7 155 0 6 51 6 103 0 154z" />,
  );
};
IconGlobalFilled.propTypes = {
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
