import * as React from 'react';
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';
export const IconDocumentCodeFilled = ({
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
    <path d="M333 51H170C98 51 67 92 67 154v204c0 62 31 103 103 103h163c72 0 103-41 103-103V154c0-62-31-103-103-103zM221 348c6 5 6 15 0 21-3 3-7 5-10 5-4 0-8-2-11-5l-41-41c-6-6-6-15 0-21l41-41c6-6 15-6 21 0s6 15 0 21l-30 30zm123-20-41 41c-3 3-7 5-11 5-3 0-7-2-10-5-6-6-6-16 0-21l30-31-30-30c-6-6-6-15 0-21s15-6 21 0l41 41c6 6 6 15 0 21zm41-128h-41c-31 0-57-26-57-57v-41c0-8 7-15 16-15 8 0 15 7 15 15v41c0 14 12 26 26 26h41c8 0 15 7 15 15 0 9-7 16-15 16z" />,
  );
};
IconDocumentCodeFilled.propTypes = {
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
