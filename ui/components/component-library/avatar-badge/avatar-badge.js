import React from 'react';
import PropTypes from 'prop-types';
import Box from '../../ui/box/box';
import { BaseAvatar } from '../base-avatar';

export const badgePosition = ['top', 'bottom'];

export const AvatarBadge = ({
  children,
  badgeProps,
  BadgeVariant,
  ...props
}) => {
  return (
    <Box className="avatar-badge">
      <BaseAvatar className="avatar-badge__container" {...props}>
        {/* Jazzicon , Avatar Account */}
        {children}
      </BaseAvatar>
      <Box
        className={
          props.badgePosition === 'top'
            ? 'avatar-badge-token-position-top'
            : 'avatar-badge-token-position-bottom'
        }
      >
        <BadgeVariant className="avatar-badge--token-badge" {...badgeProps} />
      </Box>
    </Box>
  );
};

AvatarBadge.propTypes = {
  /**
   * The position of the AvatarBadge
   * Possible values could be 'top', 'bottom',
   */
  badgePosition: PropTypes.oneOf(badgePosition),
  /**
   * The children to be rendered inside the AvatarBadge
   */
  children: PropTypes.node,
  /**
   * The children to be rendered inside the AvatarBadge
   */
  BadgeVariant: PropTypes.func,
  /**
   * The children to be rendered inside the AvatarBadge
   */
  badgeProps: PropTypes.object,
  /**
   * Address used for generating random image
   */
  address: PropTypes.string,
  /**
   * Add custom css class
   */
  className: PropTypes.string,
};
