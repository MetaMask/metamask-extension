import React from 'react';
import NftInfoSetApprovalForAll from './nft-info-setApprovalForAll';

const collections = {
  '0x8E226f4e584F4eA8e1A09E5Ab85549F3d02566ce': {
    collectibles: [
      {
        address: '0x8E226f4e584F4eA8e1A09E5Ab85549F3d02566ce',
        description: 'Test Dapp Collectibles for testing.',
        favorite: false,
        image:
          'data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjM1MCIgd2lkdGg9IjM1MCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdGggaWQ9Ik15UGF0aCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZWQiIGQ9Ik0xMCw5MCBROTAsOTAgOTAsNDUgUTkwLDEwIDUwLDEwIFExMCwxMCAxMCw0MCBRMTAsNzAgNDUsNzAgUTcwLDcwIDc1LDUwIiAvPjwvZGVmcz48dGV4dD48dGV4dFBhdGggaHJlZj0iI015UGF0aCI+UXVpY2sgYnJvd24gZm94IGp1bXBzIG92ZXIgdGhlIGxhenkgZG9nLjwvdGV4dFBhdGg+PC90ZXh0Pjwvc3ZnPg==',
        isCurrentlyOwned: true,
        name: 'Test Dapp Collectibles #1',
        standard: 'ERC721',
        tokenId: '1',
      },
    ],
    collectionImage: null,
    collectionName: 'TestDappCollectibles',
  },
};

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
    collections: {
      control: { type: 'object' },
    },
  },
  args: {
    assetName: 'Bored Ape Yatch Club',
    tokenAddress: '0xa3aee8bce55beea1951ef834b99f3ac60d1abeeb',
    collections,
  },
};

export const DefaultStory = (args) => {
  return <NftInfoSetApprovalForAll {...args} />;
};

DefaultStory.storyName = 'Default';
