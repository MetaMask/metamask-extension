import React from 'react';
import NftInfoSetApprovalForAll from './nft-info-setApprovalForAll';

export default {
  title: 'Components/UI/NftInfoSetApprovalForAll',
  id: __filename,
  argTypes: {
    assetName: {
      control: { type: 'text' },
    },
    tokenAddress: {
      control: { type: 'text' },
    },
    total: {
      control: { type: 'number' },
    },
    isERC721: {
      control: { type: 'boolean' }
    }
  },
  args: {
    assetName: 'Bored Ape Yatch Club',
    tokenAddress: '0xa3aee8bce55beea1951ef834b99f3ac60d1abeeb',
    total: 4,
    isERC721: true,
  },
};

export const DefaultStory = (args) => {
  return <NftInfoSetApprovalForAll {...args} />;
};

DefaultStory.storyName = 'Default';
