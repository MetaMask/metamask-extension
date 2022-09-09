import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconSecurityCrossFilled = ({
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
    <path d="M385 95 273 52c-12-4-31-4-43 0L118 95c-22 8-40 33-40 56v166c0 17 11 39 25 49l112 84c20 15 53 15 73 0l112-84c14-10 24-32 24-49V151c1-23-17-48-39-56zm-79 201c-3 3-7 5-10 5-4 0-8-2-11-5l-33-32-33 33c-4 3-7 5-11 5s-8-2-11-5c-6-6-6-15 0-21l33-34-32-33c-6-6-6-15 0-21s15-6 21 0l33 32 32-32c6-6 15-6 21 0s6 16 0 22l-31 32 32 32c6 7 6 16 0 22z" />,
  );
};
IconSecurityCrossFilled.propTypes = {
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
