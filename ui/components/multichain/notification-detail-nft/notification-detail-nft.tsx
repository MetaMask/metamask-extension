import React, { FC } from 'react';
import { Box } from '../../component-library';
import { NftItem } from '../nft-item';
import {
  AlignItems,
  Display,
  JustifyContent,
} from '../../../helpers/constants/design-system';

export interface NotificationDetailNftProps {
  networkName: string;
  networkSrc: string;
  tokenName: string;
  tokenId: string;
  tokenSrc: string;
}

/**
 * A component that renders a notification detail for an NFT.
 *
 * @param props - The component props.
 * @param props.networkSrc - The URL of the badge icon.
 * @param props.tokenId - The ID of the NFT.
 * @param props.tokenName - The name of the NFT.
 * @param props.tokenSrc - The URL of the NFT icon.
 * @param props.networkName - The name of the network.
 * @returns The NotificationDetailNft component.
 */
export const NotificationDetailNft: FC<NotificationDetailNftProps> = ({
  networkSrc,
  tokenId,
  tokenName,
  tokenSrc,
  networkName,
}) => (
  <Box
    paddingBottom={4}
    display={Display.Flex}
    alignItems={AlignItems.center}
    justifyContent={JustifyContent.center}
  >
    <Box className="notification-detail-nft__image">
      <NftItem
        networkSrc={networkSrc}
        src={tokenSrc}
        name={tokenName}
        alt={tokenName}
        networkName={networkName}
        tokenId={tokenId}
      />
    </Box>
  </Box>
);
