import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconStudentFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M350 331c14-9 32 0 32 17v26c0 26-20 54-44 62l-66 22c-11 4-30 4-41 0l-66-22c-24-8-44-36-44-62v-26c0-17 18-26 31-18l43 28c16 11 36 16 57 16 20 0 41-5 57-16zm65-188L292 62c-22-14-58-14-80 0L88 143c-39 25-39 83 0 109l33 21 91 59c22 15 58 15 80 0l118-77v62c0 9 7 16 16 16 8 0 15-7 15-16V217c8-27 0-57-26-74z" />,
  );
};
IconStudentFilled.propTypes = {
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
