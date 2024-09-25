import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import {
  IconColor,
  BackgroundColor,
} from '../../../../helpers/constants/design-system';
import {
  BadgeWrapper,
  BadgeWrapperPosition,
  AvatarIcon,
  IconName,
  IconSize,
} from '../../../component-library';

import { SnapIcon } from '../snap-icon';

const SnapAvatar = ({
  snapId,
  badgeSize = IconSize.Sm,
  avatarSize = IconSize.Lg,
  borderWidth = 2,
  className,
  badgeBackgroundColor = BackgroundColor.backgroundAlternative,
}) => {
  return (
    <BadgeWrapper
      className={classnames('snap-avatar', className)}
      badge={
        <AvatarIcon
          iconName={IconName.Snaps}
          size={badgeSize}
          backgroundColor={IconColor.infoDefault}
          borderColor={badgeBackgroundColor}
          borderWidth={borderWidth}
          iconProps={{
            color: IconColor.infoInverse,
          }}
        />
      }
      position={BadgeWrapperPosition.bottomRight}
    >
      <SnapIcon snapId={snapId} avatarSize={avatarSize} />
    </BadgeWrapper>
  );
};

SnapAvatar.propTypes = {
  /**
   * The id of the snap
   */
  snapId: PropTypes.string,
  badgeSize: PropTypes.string,
  avatarSize: PropTypes.string,
  borderWidth: PropTypes.number,
  /**
   * The color of the badge background
   */
  badgeBackgroundColor: PropTypes.string,
  /**
   * The className of the SnapAvatar
   */
  className: PropTypes.string,
};

export default SnapAvatar;
