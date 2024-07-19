import React, { FC } from 'react';
import { useSelector } from 'react-redux';
import { getIpfsGateway, getOpenSeaEnabled } from '../../../selectors';
import NftDefaultImage from '../../app/assets/nfts/nft-default-image/nft-default-image';
import { isIpfsURL } from '../../../helpers/utils/notification.util';

import { NotificationDetail } from '../notification-detail';
import {
  AvatarToken,
  BadgeWrapper,
  BadgeWrapperPosition,
  Box,
  Text,
  AvatarTokenSize,
} from '../../component-library';
import {
  BackgroundColor,
  BorderColor,
  BorderRadius,
  Display,
  FontWeight,
  JustifyContent,
  TextVariant,
  TextColor,
} from '../../../helpers/constants/design-system';

type IconProps = {
  src: string;
  badgeSrc: string;
};

export type NotificationDetailCollectionProps = {
  icon: IconProps;
  label: string;
  collection: string;
};

export const NotificationDetailCollection: FC<
  NotificationDetailCollectionProps
> = ({ icon, label, collection }) => {
  const { badgeSrc, src } = icon;

  const isIpfsEnabled = useSelector(getIpfsGateway);
  const openSeaEnabled = useSelector(getOpenSeaEnabled);

  const ipfsImageIsRenderable = isIpfsEnabled && isIpfsURL(src) && src;
  const openseaImageIsRenderable = openSeaEnabled && src && !isIpfsURL(src);

  const badgeIcon = (
    <AvatarToken
      src={badgeSrc}
      backgroundColor={BackgroundColor.infoDefault}
      borderColor={BorderColor.backgroundDefault}
      borderWidth={2}
      size={AvatarTokenSize.Sm}
    />
  );

  const badgeWrapper = (
    <BadgeWrapper position={BadgeWrapperPosition.topRight} badge={badgeIcon}>
      {ipfsImageIsRenderable || openseaImageIsRenderable ? (
        <Box
          as="img"
          src={src}
          display={Display.Block}
          justifyContent={JustifyContent.center}
          backgroundColor={BackgroundColor.primaryMuted}
          borderRadius={BorderRadius.LG}
          className="notification-detail-collection__image"
        />
      ) : (
        <NftDefaultImage
          className="nft-item__default-image notification-detail-collection__image"
          data-testid="nft-default-image"
          clickable={false}
        />
      )}
    </BadgeWrapper>
  );

  const createTextComponent = (
    textVariant: TextVariant,
    fontWeight: FontWeight,
    color: TextColor,
    children: string,
  ) => (
    <Text variant={textVariant} fontWeight={fontWeight} color={color}>
      {children}
    </Text>
  );

  const primaryTextLeft = createTextComponent(
    TextVariant.bodyLgMedium,
    FontWeight.Medium,
    TextColor.textDefault,
    label,
  );
  const secondaryTextLeft = createTextComponent(
    TextVariant.bodyMd,
    FontWeight.Normal,
    TextColor.textAlternative,
    collection,
  );

  return (
    <NotificationDetail
      icon={badgeWrapper}
      primaryTextLeft={primaryTextLeft}
      secondaryTextLeft={secondaryTextLeft}
    />
  );
};
