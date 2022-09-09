import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconSecuritySearchFilled = ({
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
    <path d="M404 152v52c0 14-15 24-28 19-18-7-37-9-57-7-48 5-98 52-107 101-6 40 7 78 31 104 12 13 4 32-13 34-14 2-28 2-35-4L82 367c-13-10-24-32-24-49V152c0-23 17-48 39-56l113-43c11-4 30-4 42 0l113 43c21 8 39 33 39 56zm-71 94c-50 0-92 41-92 92s42 92 92 92c51 0 93-41 93-92s-42-92-93-92zm103 215c-6 0-11-2-15-6-1-1-2-2-2-3-1-1-2-3-2-4-1-1-1-2-1-4 0-1-1-2-1-4s1-5 2-7c1-3 2-5 4-7 5-5 12-7 19-6 1 0 2 1 4 1 1 1 2 2 3 2l3 3c2 2 4 4 5 7 1 2 1 5 1 7 0 6-2 11-6 15-1 1-2 2-3 2-1 1-2 2-3 2-2 1-3 1-4 1-2 1-3 1-4 1z" />,
  );
};
IconSecuritySearchFilled.propTypes = {
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
