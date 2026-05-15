import React from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  BoxBackgroundColor,
  BoxBorderColor,
  BoxJustifyContent,
} from '@metamask/design-system-react';
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
  IconName,
  IconSize,
} from '../../component-library';
import {
  BackgroundColor,
  BorderColor,
  BorderStyle,
  IconColor,
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
    padding={1}
    backgroundColor={BackgroundColor.transparent}
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
      asChild
      justifyContent={BoxJustifyContent.Center}
      backgroundColor={BoxBackgroundColor.PrimaryMuted}
      className="block rounded-sm notification-list-item-icon__image"
    >
      <img src={src} />
    </Box>
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
    asChild
    backgroundColor={BoxBackgroundColor.BackgroundDefault}
    className="block rounded-sm notification-list-item-icon__image"
  >
    <img />
  </Box>
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
export const NotificationListItemIcon = ({
  type,
  value,
  badge,
}: NotificationListItemIconProps): JSX.Element => {
  const IconComponent = iconComponents[type] || iconComponents.default;
  const NotificationIcon = <IconComponent src={value} />;

  return (
    <>
      {badge ? (
        getBadge(badge, NotificationIcon)
      ) : (
        <Box className="rounded-xl">{NotificationIcon}</Box>
      )}
    </>
  );
};
