import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import Box from '../../ui/box/box';
import {
  COLORS,
  SIZES,
  BACKGROUND_COLORS,
  BORDER_COLORS,
} from '../../../helpers/constants/design-system';

export const AvatarBase = ({
  size = SIZES.MD,
  children,
  backgroundColor = BACKGROUND_COLORS.BACKGROUND_ALTERNATIVE,
  borderColor = BORDER_COLORS.BORDER_DEFAULT,
  color = COLORS.TEXT_DEFAULT,
  className,
  ...props
}) => (
  <Box
    className={classnames(
      'mm-avatar-base',
      `mm-avatar-base--size-${size}`,
      className,
    )}
    {...{ backgroundColor, borderColor, color, ...props }}
  >
    {children}
  </Box>
);

AvatarBase.propTypes = {
  /**
   * The size of the AvatarBase.
   * Possible values could be 'SIZES.XS'(16px), 'SIZES.SM'(24px), 'SIZES.MD'(32px), 'SIZES.LG'(40px), 'SIZES.XL'(48px)
   * Defaults to SIZES.MD
   */
  size: PropTypes.oneOf(Object.values(SIZES)),
  /**
   * The children to be rendered inside the AvatarBase
   */
  children: PropTypes.node,
  /**
   * The background color of the AvatarBase
   * Defaults to COLORS.BACKGROUND_ALTERNATIVE
   */
  backgroundColor: Box.propTypes.backgroundColor,
  /**
   * The background color of the AvatarBase
   * Defaults to COLORS.BORDER_DEFAULT
   */
  borderColor: Box.propTypes.borderColor,
  /**
   * The color of the text inside the AvatarBase
   * Defaults to COLORS.TEXT_DEFAULT
   */
  color: Box.propTypes.color,
  /**
   * Additional classNames to be added to the AvatarToken
   */
  className: PropTypes.string,
  /**
   * AvatarBase also accepts all Box props including but not limited to
   * className, as(change root element of HTML element) and margin props
   */
  ...Box.propTypes,
};
