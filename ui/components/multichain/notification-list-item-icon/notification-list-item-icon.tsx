import React, { FC } from 'react';

import {
  AvatarIcon,
  AvatarIconSize,
  AvatarToken,
  AvatarTokenSize,
  BadgeWrapper,
  BadgeWrapperPosition,
  Box,
  IconName,
  IconSize,
} from '../../component-library';
import {
  BackgroundColor,
  BorderColor,
  BorderRadius,
  BorderStyle,
  Display,
  IconColor,
  JustifyContent,
} from '../../../helpers/constants/design-system';

export enum NotificationListItemIconType {
  Token = 'token',
  Nft = 'nft',
}

export interface BadgeProps {
  icon: IconName;
  position?: BadgeWrapperPosition;
}

export interface NotificationListItemIconProps {
  type: NotificationListItemIconType;
  value: string;
  badge?: BadgeProps;
}

const AvatarTokenComponent = ({ src }: { src: string }): JSX.Element => (
  <AvatarToken
    data-testid="avatar-token"
    src={src}
    borderStyle={BorderStyle.none}
    size={AvatarTokenSize.Md}
  />
);

const NftImage = ({ src }: { src: string }): JSX.Element => (
  <Box
    data-testid="nft-image"
    as="img"
    src={src}
    display={Display.Block}
    justifyContent={JustifyContent.center}
    backgroundColor={BackgroundColor.primaryMuted}
    borderRadius={BorderRadius.SM}
    className="notification-list-item-icon__image"
  />
);

const DefaultIcon = (): JSX.Element => (
  <Box
    data-testid="default-icon"
    as="img"
    display={Display.Block}
    borderRadius={BorderRadius.SM}
    backgroundColor={BackgroundColor.backgroundDefault}
    className="notification-list-item-icon__image"
  />
);

const getBadge = (badge: BadgeProps, children: JSX.Element): JSX.Element => {
  return (
    <BadgeWrapper
      data-testid="badge-wrapper"
      position={badge.position || BadgeWrapperPosition.bottomRight}
      badge={
        <AvatarIcon
          iconName={badge.icon}
          size={AvatarIconSize.Sm}
          backgroundColor={BackgroundColor.infoDefault}
          borderColor={BorderColor.backgroundDefault}
          borderWidth={2}
          iconProps={{
            name: badge.icon,
            color: IconColor.infoInverse,
            size: IconSize.Xs,
          }}
        />
      }
    >
      {children}
    </BadgeWrapper>
  );
};

const iconComponents = {
  [NotificationListItemIconType.Token]: AvatarTokenComponent,
  [NotificationListItemIconType.Nft]: NftImage,
  default: DefaultIcon,
};

/**
 * Renders a notification list item icon.
 *
 * @param props - The properties object.
 * @param props.type - The type of the notification item icon.
 * @param props.value - The value of the notification item icon.
 * @param props.badge - The badge of the notification item icon.
 * @returns A JSX element.
 */
export const NotificationListItemIcon: FC<NotificationListItemIconProps> = ({
  type,
  value,
  badge,
}): JSX.Element => {
  const IconComponent = iconComponents[type] || iconComponents.default;
  const NotificationIcon = <IconComponent src={value} />;

  return (
    <>
      {badge ? (
        getBadge(badge, NotificationIcon)
      ) : (
        <Box borderRadius={BorderRadius.XL}>{NotificationIcon}</Box>
      )}
    </>
  );
};
