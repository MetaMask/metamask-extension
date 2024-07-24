import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import NftCollectionImage from './nft-collection-image';



interface NftCollectionImageProps {
  assetName: string;
  tokenAddress: string;
}

const NftCollectionImageWrapper: React.FC<NftCollectionImageProps> = ({ assetName, tokenAddress }) => {
  return (
    <NftCollectionImage
      assetName={assetName}
      tokenAddress={tokenAddress}
    />
  );
};

const meta: Meta<typeof NftCollectionImageWrapper> = {
  title: 'UI/Components/UI/NftCollectionImage',
  component: NftCollectionImageWrapper,
  argTypes: {
    assetName: {
      control: 'text',
      description: 'Name of the NFT collection',
    },
    tokenAddress: {
      control: 'text',
      description: 'Address of the token',
    },
  },
};

export default meta;

type Story = StoryObj<typeof NftCollectionImageWrapper>;

export const Default: Story = {
  args: {
    assetName: 'MetaMask',
    tokenAddress: '0x1234567890123456789012345678901234567890',
  },
};

Default.storyName = 'Default';
