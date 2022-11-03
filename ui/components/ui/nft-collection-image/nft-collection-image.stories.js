import React from 'react';
import NftCollectionImage from './nft-collection-image';

export default {
  title: 'Components/UI/NftCollectionImage',
  id: __filename,
  argTypes: {
    assetName: {
      control: { type: 'text' },
    },
    tokenAddress: {
      control: { type: 'text' },
    },
  },
  args: {
    assetName: 'BoredApeYachtClub',
    tokenAddress: '0x8E226f4e584F4eA8e1A09E5Ab85549F3d02566ce',
  },
};

export const DefaultStory = (args) => {
  return <NftCollectionImage {...args} />;
};

DefaultStory.storyName = 'Default';
