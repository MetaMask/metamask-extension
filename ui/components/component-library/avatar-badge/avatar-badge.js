import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Box from '../../ui/box/box';
import { BaseAvatar } from '../base-avatar';
import { COLORS, SIZES } from '../../../helpers/constants/design-system';

export const AvatarBadge = ({
  size = SIZES.MD,
  children,
  backgroundColor = COLORS.BACKGROUND_ALTERNATIVE,
  borderColor = COLORS.BORDER_DEFAULT,
  ...props
}) => (
  <BaseAvatar
    className={classnames('avatar-badge', `avatar-badge--size-${size}`)}
    {...{ backgroundColor, borderColor, ...props }}
  >
    {children}
  </BaseAvatar>
);

AvatarBadge.propTypes = {
  /**
   * The size of the BaseAvatar.
   * Possible values could be 'xs', 'sm', 'md', 'lg', 'xl',
   */
  size: PropTypes.oneOf(Object.values(SIZES)),
  /**
   * The children to be rendered inside the BaseAvatar
   */
  children: PropTypes.node,
  /**
   * The background color of the BaseAvatar
   */
  backgroundColor: Box.propTypes.backgroundColor,
  /**
   * The background color of the BaseAvatar
   */
  borderColor: Box.propTypes.borderColor,
  /**
   * AvatarBadgeaccepts all the props from Box
   */
  ...Box.propTypes,
};
