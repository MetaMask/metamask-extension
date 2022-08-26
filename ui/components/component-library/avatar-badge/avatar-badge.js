import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Box from '../../ui/box/box';
import { BaseAvatar } from '../base-avatar';
import { SIZES } from '../../../helpers/constants/design-system';

export const badgePosition = ['top', 'bottom'];

export const AvatarBadge = ({
  size = SIZES.MD,
  children,
  className,
  badgeProps,
  BadgeVariant,
  ...props
}) => {
  return (
    <Box
      className={classnames(
        'avatar-badge',
        `avatar-badge--size-${size}`,
        className,
      )}
    >
      <BaseAvatar
        className={classnames('avatar-badge__container')}
        {...{ size, ...props }}
      >
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
        {/* Avatar Account, Avatar Network */}
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
   * Address used for generating random image
   */
  address: PropTypes.string,
  /**
   * Add custom css class
   */
  className: PropTypes.string,


};
