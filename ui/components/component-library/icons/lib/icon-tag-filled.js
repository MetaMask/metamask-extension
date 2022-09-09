import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconTagFilled = ({ size, color, className, ...props }) => {
  return React.createElement(
    BaseIcon,
    {
      size,
      color,
      className,
      ...props,
    },
    <path d="m412 188-93-92c-19-20-46-30-74-29l-102 5c-41 2-74 34-76 75l-5 103c-1 27 10 54 29 73l93 93c38 38 100 38 138 0l90-90c38-38 38-99 0-138zm-212 76c-32 0-59-27-59-59 0-33 27-59 59-59 33 0 59 26 59 59 0 32-26 59-59 59z" />,
  );
};
IconTagFilled.propTypes = {
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
