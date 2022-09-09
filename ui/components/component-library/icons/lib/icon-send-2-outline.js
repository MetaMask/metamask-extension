import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconSend2Outline = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M426 476H77c-8 0-15-7-15-15 0-9 7-16 15-16h349c8 0 15 7 15 16 0 8-7 15-15 15zm-31-92c-4 0-8-1-11-5L97 93c-6-6-6-16 0-22s16-6 22 0l287 287c6 6 6 16 0 21-3 4-7 5-11 5zm-287-76c-8 0-15-7-15-16V82c0-8 7-15 15-15h210c9 0 16 7 16 15s-7 15-16 15H124v195c0 9-7 16-16 16z" />,
  );
};
IconSend2Outline.propTypes = {
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
