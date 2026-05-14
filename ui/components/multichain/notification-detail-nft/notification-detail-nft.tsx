import React, { FC } from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import { NftItem } from '../nft-item';

export type NotificationDetailNftProps = {
  networkName: string;
  networkSrc: string;
  tokenName: string;
  tokenSrc: string;
};

/**
 * A component that renders a notification detail for an NFT.
 *
 * @param props - The component props.
 * @param props.networkSrc - The URL of the badge icon.
 * @param props.tokenName - The name of the NFT.
 * @param props.tokenSrc - The URL of the NFT icon.
 * @param props.networkName - The name of the network.
 * @returns The NotificationDetailNft component.
 */
export const NotificationDetailNft: FC<NotificationDetailNftProps> = ({
  networkSrc,
  tokenName,
  tokenSrc,
  networkName,
}) => (
  <Box
    paddingTop={1}
    paddingBottom={4}
    flexDirection={BoxFlexDirection.Row}
    alignItems={BoxAlignItems.Center}
    justifyContent={BoxJustifyContent.Center}
  >
    <Box className="notification-detail-nft__image">
      <NftItem
        networkSrc={networkSrc}
        src={tokenSrc}
        name={tokenName}
        alt={tokenName}
        networkName={networkName}
      />
    </Box>
  </Box>
);
