import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconCheckCircleOnFilled = ({
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
    <path d="M27 256C27 130 130 27 256 27s229 103 229 229-103 229-229 229S27 382 27 256zM256 59C148 59 59 148 59 256s89 197 197 197 197-89 197-197S364 59 256 59zm213 197c0 117-96 213-213 213S43 373 43 256 139 43 256 43s213 96 213 213zm-111-49c6-6 6-16 0-23-6-6-16-6-23 0L226 294l-49-49c-7-7-17-7-23 0-6 6-6 16 0 22l60 61c7 6 17 6 23 0z" />,
  );
};
IconCheckCircleOnFilled.propTypes = {
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
