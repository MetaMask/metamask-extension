import React, { FC } from 'react';
import { useSelector } from 'react-redux';
import { getIpfsGateway, getOpenSeaEnabled } from '../../../selectors';
import NftDefaultImage from '../../app/assets/nfts/nft-default-image/nft-default-image';
import { isIpfsURL } from '../../../helpers/utils/notification.util';

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

export type BadgeProps = {
  icon: IconName;
  position?: BadgeWrapperPosition;
};

export type NotificationListItemIconProps = {
  type: NotificationListItemIconType;
  value: string;
  badge?: BadgeProps;
};

const useNftImageRenderability = (src: string) => {
  const isIpfsEnabled = useSelector(getIpfsGateway);
  const openSeaEnabled = useSelector(getOpenSeaEnabled);
  const isIpfs = isIpfsURL(src);

  const ipfsImageIsRenderable = isIpfsEnabled && isIpfs && src;
  const openseaImageIsRenderable = openSeaEnabled && src && !isIpfs;

  return { ipfsImageIsRenderable, openseaImageIsRenderable, isIpfs };
};

const AvatarTokenComponent = ({ src }: { src: string }): JSX.Element => (
  <AvatarToken
    data-testid="avatar-token"
    src={src}
    borderStyle={BorderStyle.none}
    size={AvatarTokenSize.Md}
  />
);

const NftImage = ({ src }: { src: string }): JSX.Element => {
  const { ipfsImageIsRenderable, openseaImageIsRenderable, isIpfs } =
    useNftImageRenderability(src);

  return ipfsImageIsRenderable || openseaImageIsRenderable ? (
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
  ) : (
    <NftDefaultImage
      className="nft-item__default-image notification-list-item-icon__image"
      data-testid="nft-default-image"
      clickable={isIpfs}
    />
  );
};

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
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
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
  [NotificationListItemIconType.Nft]: ({ src }: { src: string }) => (
    <NftImage src={src} />
  ),
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
