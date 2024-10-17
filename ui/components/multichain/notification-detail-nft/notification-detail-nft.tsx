import React, { FC } from 'react';
import { Box } from '../../component-library';
import { NftItem } from '../nft-item';
import {
  AlignItems,
  Display,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import { TokenStandard } from '../../../../shared/constants/transaction';

export type NotificationDetailNftProps = {
  nft: {
    address: string;
    chainId: string;
    image: string;
    name: string;
    standard: TokenStandard;
    tokenId: string;
  };
};

/**
 * A component that renders a notification detail for an NFT.
 *
 * @param props - The component props.
 * @param props.nft - NFT properties.
 * @returns The NotificationDetailNft component.
 */
export const NotificationDetailNft: FC<NotificationDetailNftProps> = ({
  nft,
}) => (
  <Box
    paddingTop={1}
    paddingBottom={4}
    display={Display.Flex}
    alignItems={AlignItems.center}
    justifyContent={JustifyContent.center}
  >
    <Box className="notification-detail-nft__image">
      <NftItem nft={nft} />
    </Box>
  </Box>
);
