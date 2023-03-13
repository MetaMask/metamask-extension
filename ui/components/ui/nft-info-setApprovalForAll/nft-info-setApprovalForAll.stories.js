import React from 'react';
import NftInfoSetApprovalForAll from './nft-info-setApprovalForAll';

export default {
  title: 'Components/UI/NftInfoSetApprovalForAll',

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
      control: { type: 'boolean' },
    },
  },
  args: {
    assetName: 'BoredApeYatchClub',
    tokenAddress: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
    total: 4,
    isERC721: true,
  },
};

export const DefaultStory = (args) => {
  return <NftInfoSetApprovalForAll {...args} />;
};

DefaultStory.storyName = 'Default';

export const NftInfoSetApprovalForAllWithoutAssetName = (args) => {
  return <NftInfoSetApprovalForAll {...args} assetName={null} />;
};

export const NftInfoSetApprovalForAllErc1155 = (args) => {
  return (
    <NftInfoSetApprovalForAll {...args} assetName={null} isERC721={false} />
  );
};
