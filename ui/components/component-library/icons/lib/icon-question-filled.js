import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconQuestionFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M456 256c0 113-91 205-204 205-114 0-205-92-205-205S138 51 252 51c113 0 204 92 204 205zM252 148c-33 0-63 24-63 58 0 9 8 17 17 17s17-8 17-17c0-12 11-24 29-24 17 0 28 12 28 24 0 6-4 11-14 17-12 8-32 21-32 48v5c0 9 8 17 18 17 9 0 17-8 17-17v-5c0-7 3-12 15-19 11-7 30-20 30-46 0-34-30-58-62-58zm-1 170c-9 0-17 7-17 17 0 9 8 17 17 17h1c9 0 17-8 17-17 0-10-8-17-17-17z" />,
  );
};
IconQuestionFilled.propTypes = {
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
