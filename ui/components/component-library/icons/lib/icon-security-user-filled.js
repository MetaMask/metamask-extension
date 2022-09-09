import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconSecurityUserFilled = ({
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
    <path d="M385 94 282 56c-17-6-44-6-61 0L118 94c-23 9-42 37-42 62v152c0 24 16 56 35 71l88 65c29 22 76 22 105 0l88-65c20-15 36-47 36-71V156c-1-25-20-53-43-62zm-135 60c24 0 44 20 44 44s-19 43-42 44h-2c-25-1-43-20-43-44-1-24 19-44 43-44zm46 191c-12 8-28 13-44 13-17 0-33-4-45-13-12-7-18-18-19-30 0-11 7-22 19-30 24-17 65-17 90 0 11 8 18 18 18 30 0 11-7 23-19 30z" />,
  );
};
IconSecurityUserFilled.propTypes = {
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
