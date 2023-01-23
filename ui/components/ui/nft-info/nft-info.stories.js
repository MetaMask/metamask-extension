import React from 'react';
import NftInfo from './nft-info';

export default {
  title: 'Components/UI/NftInfo',

  argTypes: {
    assetName: {
      control: { type: 'text' },
    },
    tokenAddress: {
      control: { type: 'text' },
    },
    tokenId: {
      control: { type: 'text' },
    },
  },
  args: {
    assetName: 'Catnip Spicewight',
    tokenAddress: '0xa3aee8bce55beea1951ef834b99f3ac60d1abeeb',
    tokenId: '112233',
  },
};

export const DefaultStory = (args) => {
  return <NftInfo {...args} />;
};

DefaultStory.storyName = 'Default';
