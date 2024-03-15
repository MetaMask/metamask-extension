import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useSelector } from 'react-redux';
import {
  TextColor,
  IconColor,
  AlignItems,
  Display,
  JustifyContent,
  BackgroundColor,
} from '../../../../helpers/constants/design-system';
import {
  AvatarFavicon,
  BadgeWrapper,
  BadgeWrapperPosition,
  AvatarIcon,
  AvatarBase,
  IconName,
  IconSize,
} from '../../../component-library';
import {
  getSnapMetadata,
  getTargetSubjectMetadata,
} from '../../../../selectors';

const SnapAvatar = ({
  snapId,
  badgeSize = IconSize.Sm,
  avatarSize = IconSize.Lg,
  borderWidth = 2,
  className,
}) => {
  const subjectMetadata = useSelector((state) =>
    getTargetSubjectMetadata(state, snapId),
  );

  const { name: snapName } = useSelector((state) =>
    getSnapMetadata(state, snapId),
  );

  const iconUrl = subjectMetadata?.iconUrl;

  // We choose the first non-symbol char as the fallback icon.
  const fallbackIcon = snapName?.match(/[a-z0-9]/iu)?.[0] ?? '?';

  return (
    <BadgeWrapper
      className={classnames('snap-avatar', className)}
      badge={
        <AvatarIcon
          iconName={IconName.Snaps}
          size={badgeSize}
          backgroundColor={IconColor.infoDefault}
          borderColor={BackgroundColor.backgroundDefault}
          borderWidth={borderWidth}
          iconProps={{
            color: IconColor.infoInverse,
          }}
        />
      }
      position={BadgeWrapperPosition.bottomRight}
    >
      {iconUrl ? (
        <AvatarFavicon
          backgroundColor={BackgroundColor.backgroundAlternative}
          size={avatarSize}
          src={iconUrl}
          name={snapName}
        />
      ) : (
        <AvatarBase
          size={avatarSize}
          display={Display.Flex}
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.center}
          color={TextColor.textAlternative}
          style={{ borderWidth: '0px' }}
          backgroundColor={BackgroundColor.backgroundAlternative}
        >
          {fallbackIcon}
        </AvatarBase>
      )}
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
   * The className of the SnapAvatar
   */
  className: PropTypes.string,
};

export default SnapAvatar;
