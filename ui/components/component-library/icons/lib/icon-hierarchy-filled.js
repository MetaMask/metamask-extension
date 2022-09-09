import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconHierarchyFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="M108 174c34 0 62-27 62-61s-28-62-62-62-61 28-61 62 27 61 61 61zm287 143c34 0 61-27 61-61s-27-61-61-61-62 27-62 61 28 61 62 61zM108 461c34 0 62-28 62-62s-28-61-62-61-61 27-61 61 27 62 61 62zm0-108c-8 0-15-7-15-15V174c0-8 7-15 15-15 9 0 16 7 16 15 0 45 21 67 66 67h143c9 0 16 7 16 15s-7 15-16 15H190c-28 0-50-7-66-20v87c0 8-7 15-16 15z" />,
  );
};
IconHierarchyFilled.propTypes = {
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
