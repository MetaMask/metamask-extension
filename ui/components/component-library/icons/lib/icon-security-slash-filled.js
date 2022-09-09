import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconSecuritySlashFilled = ({
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
    <path d="M402 105 125 382l-22-16c-14-10-25-32-25-49V151c0-23 18-48 40-56l112-43c12-4 31-4 43 0l112 43c6 2 12 6 17 10zm23 212c0 17-11 39-25 49l-112 84c-20 14-53 14-73 0l-36-27c-10-7-11-22-2-31l213-213c12-12 35-3 35 15zm27-261c-7-6-17-6-23 0L51 434c-6 6-6 16 0 22 3 3 7 5 11 5 5 0 8-2 12-5L452 78c6-6 6-16 0-22z" />,
  );
};
IconSecuritySlashFilled.propTypes = {
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
