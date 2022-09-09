import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconPasswordCheckFilled = ({
  size,
  color,
  className,
  ...props
}) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M374 92h-46V67c0-9-7-16-15-16s-15 7-15 16v378c0 9 7 16 15 16s15-7 15-16v-25h46c46 0 82-37 82-82V174c0-45-36-82-82-82zm-235 0c-45 0-82 37-82 82v164c0 45 37 82 82 82h102c12 0 21-9 21-21V113c0-12-9-21-21-21zm3 172c-1 2-2 4-4 7-2 1-4 3-7 4-2 1-5 1-7 1-3 0-6 0-8-1-3-1-5-3-7-4-2-3-3-5-5-7-1-3-1-5-1-8 0-5 2-11 6-15 1 0 2-1 3-2s3-1 4-2c1 0 2-1 3-1 7-2 14 1 19 5 4 4 6 10 6 15 0 3-1 5-2 8zm72 0c-1 2-2 4-4 7-2 1-5 3-7 4s-5 1-8 1c-2 0-5 0-8-1-2-1-4-3-6-4-4-4-6-9-6-15 0-3 0-5 1-8 1-2 3-4 5-7 7-7 21-7 29 0 3 4 6 10 6 15 0 3-1 5-2 8z" />,
  );
};
IconPasswordCheckFilled.propTypes = {
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
