import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconCalculatorFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M333 51H170C113 51 67 97 67 154v204c0 57 46 103 103 103h163c57 0 103-46 103-103V154c0-57-46-103-103-103zM187 392c-4 4-9 6-14 6-6 0-11-2-15-6s-6-9-6-15c0-5 2-10 6-14 2-2 4-4 7-5 5-2 11-2 16 0 1 1 2 1 3 2l3 3c4 4 6 9 6 14 0 6-2 11-6 15zm-35-97c0-2 1-5 2-7 1-3 2-5 4-7 5-5 12-7 19-6 1 0 2 1 4 1 1 1 2 2 3 2l3 3c2 2 4 4 5 7 1 2 1 5 1 7 0 6-2 11-6 15s-9 6-14 6c-3 0-6-1-8-2-3-1-5-2-7-4-4-4-6-9-6-15zm117 97c-2 2-4 3-6 4-3 1-6 2-8 2-6 0-11-2-15-6s-6-9-6-15c0-1 0-2 1-4 0-1 0-2 1-4 0-1 1-2 2-3 0-1 1-2 2-3 2-2 4-4 7-5 7-3 16-1 22 5 4 4 6 9 6 14 0 6-2 11-6 15zm0-82c-4 4-9 6-14 6-6 0-11-2-15-6s-6-9-6-15c0-5 2-10 6-14 8-8 22-8 29 0 2 2 4 4 5 7 1 2 1 5 1 7 0 6-2 11-6 15zm-79-86c-21 0-38-17-38-38v-21c0-21 17-38 38-38h123c21 0 38 17 38 38v21c0 21-17 38-38 38zm161 168c-4 4-9 6-14 6-3 0-6-1-8-2-3-1-5-2-7-4-4-4-6-9-6-15 0-5 2-10 6-14 6-6 15-8 23-5 2 1 4 3 6 5 4 4 6 9 6 14 0 6-2 11-6 15zm5-89c-1 3-3 5-5 7-4 4-9 6-14 6-6 0-11-2-15-6s-6-9-6-15c0-5 2-10 6-14 8-8 21-8 29 0 4 4 6 9 6 14 0 3 0 6-1 8z" />,
  );
};
IconCalculatorFilled.propTypes = {
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
