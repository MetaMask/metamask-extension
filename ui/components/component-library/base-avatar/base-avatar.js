import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import Box from '../../ui/box/box';
import { COLORS, SIZES } from '../../../helpers/constants/design-system';

export const BaseAvatar = ({
  size = SIZES.MD,
  children,
  backgroundColor = COLORS.BACKGROUND_ALTERNATIVE,
  borderColor = COLORS.BORDER_DEFAULT,
  color = COLORS.TEXT_DEFAULT,
  className,
  ...props
}) => (
  <Box
    className={classnames(
      'base-avatar',
      `base-avatar--size-${size}`,
      className,
    )}
    {...{ backgroundColor, borderColor, color, ...props }}
  >
    {children}
  </Box>
);

BaseAvatar.propTypes = {
  /**
   * The size of the BaseAvatar.
   * Possible values could be 'SIZES.XS', 'SIZES.SM', 'SIZES.MD', 'SIZES.LG', 'SIZES.XL'
   * Defaults to SIZES.MD
   */
  size: PropTypes.oneOf(Object.values(SIZES)),
  /**
   * The children to be rendered inside the BaseAvatar
   */
  children: PropTypes.node,
  /**
   * The background color of the BaseAvatar
   * Defaults to COLORS.BACKGROUND_ALTERNATIVE
   */
  backgroundColor: Box.propTypes.backgroundColor,
  /**
   * The background color of the BaseAvatar
   * Defaults to COLORS.BORDER_DEFAULT
   */
  borderColor: Box.propTypes.borderColor,
  /**
   * The color of the text inside the BaseAvatar
   * Defaults to COLORS.TEXT_DEFAULT
   */
  color: Box.propTypes.color,
  /**
   * Additional classNames to be added to the AvatarToken
   */
  className: PropTypes.string,
  /**
   * BaseAvatar also accepts all Box props including but not limited to
   * className, as(change root element of HTML element) and margin props
   */
  ...Box.propTypes,
};
