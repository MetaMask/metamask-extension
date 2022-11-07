import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import Box from '../../ui/box/box';

import {
  SIZES,
  COLORS,
  ICON_COLORS,
} from '../../../helpers/constants/design-system';

export const Icon = ({
  name,
  size = SIZES.MD,
  color = COLORS.INHERIT,
  className,
  style,
  ...props
}) => {
  return (
    <Box
      color={color}
      className={classnames(className, 'icon', `icon--size-${size}`)}
      style={{
        /**
         * To reduce the possibility of injection attacks
         * the icon component uses mask-image instead of rendering
         * the svg directly.
         */
        maskImage: `url('./images/icons/icon-${name}.svg`,
        WebkitMaskImage: `url('./images/icons/icon-${name}.svg`,
        ...style,
      }}
      {...props}
    />
  );
};

Icon.propTypes = {
  /**
   * The name of the icon to display. Should be one of ICON_NAMES
   */
  name: PropTypes.string.isRequired, // Can't set PropTypes.oneOf(ICON_NAMES) because ICON_NAMES is an environment variable
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
   * Addition style properties to apply to the icon.
   * The Icon component uses inline styles to apply the icon's mask-image so be wary of overriding
   */
  style: PropTypes.object,
  /**
   * Icon accepts all the props from Box
   */
  ...Box.propTypes,
};
