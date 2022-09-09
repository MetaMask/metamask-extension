import React from 'react';
import PropTypes from 'prop-types';
import Box from '../../ui/box/box';
import { BaseAvatar } from '../base-avatar';
import { SIZES } from '../../../helpers/constants/design-system';

export const badgePositions = ['top', 'bottom'];

export const AvatarWithBadge = ({
  children,
  badgeProps,
  badgePosition,
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
          badgePosition === 'top'
            ? 'avatar-badge-token-position-top'
            : 'avatar-badge-token-position-bottom'
        }
      >
        <BadgeVariant
          className="avatar-badge--token-badge"
          size={SIZES.XS}
          {...badgeProps}
        />
      </Box>
    </Box>
  );
};

AvatarWithBadge.propTypes = {
  /**
   * The position of the AvatarWithBadge
   * Possible values could be 'top', 'bottom',
   */
  badgePosition: PropTypes.oneOf(badgePositions),
  /**
   * The children to be rendered inside the AvatarWithBadge
   */
  children: PropTypes.node,
  /**
   * The children to be rendered inside the AvatarWithBadge
   */
  BadgeVariant: PropTypes.func,
  /**
   * The children to be rendered inside the AvatarWithBadge
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
