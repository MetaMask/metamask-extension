import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconSecurityTimeFilled = ({
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
    <path d="M252 179c-37 0-67 30-67 67 0 36 30 66 67 66 36 0 66-30 66-66 0-37-30-67-66-67zm20 60c0 13-7 25-17 31l-16 9c-3 2-5 3-8 3-5 0-10-3-13-8-5-7-2-17 5-21l16-9c1-1 2-3 2-5v-19c0-8 7-15 15-15 9 0 16 7 16 15zM385 96 273 53c-12-4-31-4-43 0L118 96c-22 8-40 33-40 56v166c0 17 11 39 25 49l112 84c20 15 53 15 73 0l112-84c14-10 24-32 24-49V152c1-23-17-48-39-56zM252 343c-54 0-98-44-98-97 0-54 44-98 98-98 53 0 97 44 97 98 0 53-44 97-97 97z" />,
  );
};
IconSecurityTimeFilled.propTypes = {
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
