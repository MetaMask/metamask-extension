import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconCardFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M456 165c0 13-11 24-24 24H71c-13 0-24-11-24-24 0-47 38-85 84-85h240c47 0 85 38 85 85zM47 245v102c0 47 38 85 84 85h240c47 0 85-38 85-85V245c0-14-11-25-24-25H71c-13 0-24 11-24 25zm123 119h-41c-9 0-16-7-16-16 0-8 7-15 16-15h41c8 0 15 7 15 15 0 9-7 16-15 16zm133 0h-82c-9 0-16-7-16-16 0-8 7-15 16-15h82c8 0 15 7 15 15 0 9-7 16-15 16z" />,
  );
};
IconCardFilled.propTypes = {
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
