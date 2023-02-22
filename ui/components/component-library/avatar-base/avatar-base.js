import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import Box from '../../ui/box/box';
import {
  BackgroundColor,
  BorderColor,
  TextColor,
} from '../../../helpers/constants/design-system';
import { AVATAR_BASE_SIZES } from './avatar-base.constants';

export const AvatarBase = ({
  size = AVATAR_BASE_SIZES.MD,
  children,
  backgroundColor = BackgroundColor.backgroundAlternative,
  borderColor = BorderColor.borderDefault,
  color = TextColor.textDefault,
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
   * Possible values could be 'AVATAR_BASE_SIZES.XS'(16px), 'AVATAR_BASE_SIZES.SM'(24px), 'AVATAR_BASE_SIZES.MD'(32px), 'AVATAR_BASE_SIZES.LG'(40px), 'AVATAR_BASE_SIZES.XL'(48px)
   * Defaults to AVATAR_BASE_SIZES.MD
   */
  size: PropTypes.oneOf(Object.values(AVATAR_BASE_SIZES)),
  /**
   * The children to be rendered inside the AvatarBase
   */
  children: PropTypes.node,
  /**
   * The background color of the AvatarBase
   * Defaults to Color.backgroundAlternative
   */
  backgroundColor: Box.propTypes.backgroundColor,
  /**
   * The background color of the AvatarBase
   * Defaults to Color.borderDefault
   */
  borderColor: Box.propTypes.borderColor,
  /**
   * The color of the text inside the AvatarBase
   * Defaults to TextColor.textDefault
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
