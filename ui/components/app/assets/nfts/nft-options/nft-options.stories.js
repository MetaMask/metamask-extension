import React from 'react';
import NftOptions from './nft-options';

export default {
  title: 'Components/App/NftOptions',
  component: NftOptions,
  argTypes: {
    onRemove: {
      action: 'onRemove',
    },
    onViewOnOpensea: {
      action: 'onViewOnOpensea',
    },
  },
};

export const DefaultStory = (args) => <NftOptions {...args} />;

DefaultStory.storyName = 'Default';
