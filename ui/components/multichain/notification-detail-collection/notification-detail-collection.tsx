import React, { FC } from 'react';
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

interface IconProps {
  src: string;
  badgeSrc: string;
}

export interface NotificationDetailCollectionProps {
  icon: IconProps;
  label: string;
  collection: string;
}

export const NotificationDetailCollection: FC<
  NotificationDetailCollectionProps
> = ({ icon, label, collection }) => {
  const { badgeSrc, src } = icon;

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
      <Box
        as="img"
        src={src}
        display={Display.Block}
        justifyContent={JustifyContent.center}
        backgroundColor={BackgroundColor.primaryMuted}
        borderRadius={BorderRadius.LG}
        className="notification-detail-collection__image"
      />
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
