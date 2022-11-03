import React from 'react';
import NftInfo from './nft-info';

export default {
  title: 'Components/UI/NftInfo',
  id: __filename,
  argTypes: {
    assetName: {
      control: { type: 'text' },
    },
    tokenId: {
      control: { type: 'text' },
    },
    tokenAddress: {
      control: { type: 'text' },
    },
    onView: {
      action: 'onView',
    },
  },
  args: {
    assetName: 'TestDappCollectibles',
    tokenId: '1',
    tokenAddress: '0x8E226f4e584F4eA8e1A09E5Ab85549F3d02566ce',
  },
};

export const NftCollectionNameExist = (args) => {
  return <NftInfo {...args} />;
};
