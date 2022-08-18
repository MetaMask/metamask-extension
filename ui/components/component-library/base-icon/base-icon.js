import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Box from '../../ui/box/box';

import {
  SIZES,
  COLORS,
  ICON_COLORS,
} from '../../../helpers/constants/design-system';

export const BaseIcon = ({
  className,
  size = SIZES.MD,
  color = COLORS.INHERIT,
  children,
  ...props
}) => {
  return (
    <Box
      as="svg"
      viewBox="0 0 512 512"
      className={classnames(className, 'base-icon', `base-icon--size-${size}`)}
      color={color}
      {...props}
    >
      {children}
    </Box>
  );
};

BaseIcon.propTypes = {
  /**
   * The size of the BaseIcon.
   * Possible values could be 'SIZES.XXS', 'SIZES.XS', 'SIZES.SM', 'SIZES.MD', 'SIZES.LG', 'SIZES.XL',
   * Default value is 'SIZES.MD'.
   */
  size: PropTypes.oneOf(Object.values(SIZES)),
  /**
   * The color of the icon.
   * Defaults to COLORS.INHERIT.
   */
  color: PropTypes.oneOf(Object.values(ICON_COLORS)),
  /**
   * An additional className to apply to the icon.
   */
  className: PropTypes.string,
  /**
   * The <path> to the icon.
   */
  children: PropTypes.node,
  /**
   * BaseIcon accepts all the props from Box
   */
  ...Box.propTypes,
};
