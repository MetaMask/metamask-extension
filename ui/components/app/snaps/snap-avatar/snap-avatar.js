import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useSelector } from 'react-redux';
import {
  TextColor,
  IconColor,
  AlignItems,
  DISPLAY,
  JustifyContent,
  Size,
  BackgroundColor,
} from '../../../../helpers/constants/design-system';
import { getSnapName } from '../../../../helpers/utils/util';
import {
  AvatarFavicon,
  BadgeWrapper,
  BadgeWrapperPosition,
  AvatarIcon,
  AvatarBase,
  IconName,
  IconSize,
} from '../../../component-library';
import { getTargetSubjectMetadata } from '../../../../selectors';

const SnapAvatar = ({ snapId, className }) => {
  const subjectMetadata = useSelector((state) =>
    getTargetSubjectMetadata(state, snapId),
  );

  const friendlyName = snapId && getSnapName(snapId, subjectMetadata);

  const iconUrl = subjectMetadata?.iconUrl;

  const fallbackIcon = friendlyName && friendlyName[0] ? friendlyName[0] : '?';

  return (
    <BadgeWrapper
      className={classnames('snap-avatar', className)}
      badge={
        <AvatarIcon
          iconName={IconName.Snaps}
          size={IconSize.Sm}
          backgroundColor={IconColor.infoDefault}
          borderColor={BackgroundColor.backgroundDefault}
          borderWidth={2}
          iconProps={{
            size: IconSize.Sm,
            color: IconColor.infoInverse,
          }}
        />
      }
      position={BadgeWrapperPosition.bottomRight}
    >
      {iconUrl ? (
        <AvatarFavicon size={Size.LG} src={iconUrl} name={friendlyName} />
      ) : (
        <AvatarBase
          size={Size.LG}
          display={DISPLAY.FLEX}
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.center}
          color={TextColor.textAlternative}
          style={{ borderWidth: '0px' }}
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
  /**
   * The className of the SnapAvatar
   */
  className: PropTypes.string,
};

export default SnapAvatar;
