import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconCheckBoxOnFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M345 43H167C89 43 43 89 43 167v178c0 78 46 124 124 124h178c78 0 124-46 124-124V167c0-78-46-124-124-124zm13 164L237 328c-3 3-7 5-11 5-5 0-9-2-12-5l-60-60c-6-7-6-17 0-23s16-6 23 0l49 49 109-110c7-6 17-6 23 0 6 7 6 17 0 23z" />,
  );
};
IconCheckBoxOnFilled.propTypes = {
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
