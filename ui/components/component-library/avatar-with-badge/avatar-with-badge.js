import React from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import Box from '../../ui/box/box';
import { BADGE_POSITIONS } from './avatar-with-badge.constants';

export const AvatarWithBadge = ({
  children,
  badgePosition,
  className,
  badge,
  badgeWrapperProps,
  ...props
}) => {
  return (
    <Box className={classnames('avatar-with-badge', className)} {...props}>
      {/* Generally the AvatarAccount */}
      {children}
      <Box
        className={
          badgePosition === 'top'
            ? 'avatar-with-badge__badge-wrapper--position-top'
            : 'avatar-with-badge__badge-wrapper--position-bottom'
        }
        {...badgeWrapperProps}
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
  badgePosition: PropTypes.oneOf(Object.values(BADGE_POSITIONS)),
  /**
   * The Badge Wrapper props of the component. All Box props can be used
   */
  badgeWrapperProps: PropTypes.shape(Box.PropTypes),
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
