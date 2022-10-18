import React from 'react';
import NftInfo from './nft-info';

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
  title: 'Components/UI/NftInfo',
  id: __filename,
  argTypes: {
    collections: {
      control: { type: 'object' },
    },
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
    collections,
    assetName: 'TestDappCollectibles',
    tokenId: '1',
    tokenAddress: '0x8E226f4e584F4eA8e1A09E5Ab85549F3d02566ce',
  },
};

export const NftCollectionNameExist = (args) => {
  return <NftInfo {...args} />;
};

export const NftCollectionNameDoNotExist = () => {
  return (
    <NftInfo
      collections={collections}
      assetName="Catnip Spicewight"
      tokenId="112233"
      tokenAddress="0x8E226f4e584F4eA8e1A09E5Ab85549F3d02566ce"
    />
  );
};
