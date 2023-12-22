import React, { FC } from 'react';
import {
  AvatarTokenSize,
  AvatarToken,
  BadgeWrapper,
  BadgeWrapperAnchorElementShape,
  Box,
} from '../../component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  BorderRadius,
  Display,
  JustifyContent,
} from '../../../helpers/constants/design-system';

export interface NotificationDetailNftProps {
  badgeIcon: string;
  nftIcon: string;
}

const NftImage: FC<{ nftIcon: string }> = ({ nftIcon }) => (
  <Box
    as="img"
    src={nftIcon}
    display={Display.Block}
    justifyContent={JustifyContent.center}
    backgroundColor={BackgroundColor.primaryMuted}
    borderRadius={BorderRadius.SM}
    className="notification-detail-nft__image"
  />
);

/**
 * A component that renders a notification detail for an NFT.
 *
 * @param props - The component props.
 * @param props.badgeIcon - The URL of the badge icon.
 * @param props.nftIcon - The URL of the NFT icon.
 * @returns The NotificationDetailNft component.
 */
export const NotificationDetailNft: FC<NotificationDetailNftProps> = ({
  badgeIcon,
  nftIcon,
}) => (
  <Box
    paddingBottom={4}
    display={Display.Flex}
    alignItems={AlignItems.center}
    justifyContent={JustifyContent.center}
  >
    <BadgeWrapper
      anchorElementShape={BadgeWrapperAnchorElementShape.rectangular}
      positionObj={{ bottom: -4, right: -4 }}
      badge={
        <AvatarToken
          src={badgeIcon}
          size={AvatarTokenSize.Sm}
          backgroundColor={BackgroundColor.infoDefault}
          borderColor={BorderColor.backgroundDefault}
          borderWidth={2}
        />
      }
    >
      <NftImage nftIcon={nftIcon} />
    </BadgeWrapper>
  </Box>
);
