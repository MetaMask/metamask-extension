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
      {/* Jazzicon , Avatar Account */}
      {children}

      <Box
        className={
          badgePosition === 'top'
            ? 'avatar-badge-token-position-top'
            : 'avatar-badge-token-position-bottom'
        }
      >
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
   * The required props to be passed to the badge
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
