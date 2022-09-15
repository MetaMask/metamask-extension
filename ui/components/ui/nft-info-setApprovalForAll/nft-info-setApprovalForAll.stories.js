import React from 'react';
import NftInfoSetApprovalForAll from './nft-info-setApprovalForAll';

export default {
  title: 'Components/UI/NftInfoSetApprovalForAll',
  id: __filename,
  argTypes: {
    tokenName: {
      control: { type: 'text' },
    },
    tokenAddress: {
      control: { type: 'text' },
    },
    nftNumber: {
      control: { type: 'number' },
    },
  },
  args: {
    tokenName: 'Bored Ape Yatch Club',
    tokenAddress: '0xa3aee8bce55beea1951ef834b99f3ac60d1abeeb',
    nftNumber: 4,
  },
};

export const DefaultStory = (args) => {
  return <NftInfoSetApprovalForAll {...args} />;
};

DefaultStory.storyName = 'Default';
