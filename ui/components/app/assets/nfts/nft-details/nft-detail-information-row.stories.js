import React from 'react';
import NftDetailInformationRow from './nft-detail-information-row';

export default {
  title: 'Components/App/Assets/Nfts/NftDetails/NftDetailInformationRow',

  argTypes: {
    nft: {
      control: 'object',
    },
  },
  args: {
    title: 'Components/App/Assets/Nfts/NftDetails/NftDetailInformationRow',
    value: '345',
  },
};

export const DefaultStory = (args) => {
  return <NftDetailInformationRow {...args} />;
};

DefaultStory.storyName = 'Default';
