import React from 'react';
import PropTypes from 'prop-types';
import Box from '../../ui/box/box';

export const badgePositions = ['top', 'bottom'];

export const AvatarWithBadge = ({
  children,
  badgePosition,
  badge,
  ...props
}) => {
  return (
    <Box className="avatar-badge" {...props}>
      {/* Generally the AvatarAccount */}
      {children}
      <Box
        className={
          badgePosition === 'top'
            ? 'avatar-badge-token-position-top'
            : 'avatar-badge-token-position-bottom'
        }
      >
        {/* Generally the AvatarNetwork at SIZES.XS */}
        {badge}
      </Box>
    </Box>
  );
};

AvatarWithBadge.propTypes = {
  /**
   * The position of the Badge
   * Possible values could be 'top', 'bottom',
   */
  badgePosition: PropTypes.oneOf(badgePositions),
  /**
   * The children to be rendered inside the AvatarWithBadge
   */
  children: PropTypes.node,
  /**
   * The badge to be rendered inside the AvatarWithBadge
   */
  badge: PropTypes.object,
  /**
   * Add custom css class
   */
  className: PropTypes.string,
};
