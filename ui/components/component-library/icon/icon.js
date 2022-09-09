import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import Box from '../../ui/box/box';

import { SIZES, ICON_COLORS } from '../../../helpers/constants/design-system';

import { ICON_NAMES } from './iconNames';

export const Icon = ({ name, size = SIZES.MD, color, className, ...props }) => {
  return (
    <Box
      color={color}
      className={classnames(
        className,
        'icon',
        `icon--size-${size}`,
        `icon--${name}`,
      )}
      {...props}
    />
  );
};

Icon.propTypes = {
  /**
   * The name of the icon to display. Should be one of ICON_NAMES
   */
  name: PropTypes.oneOf(Object.values(ICON_NAMES)),
  /**
   * The size of the Icon.
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
   * Icon accepts all the props from Box
   */
  ...Box.propTypes,
};
