import React from 'react';
import NftOptions from './nft-options';

export default {
  title: 'Components/App/NftOptions',
  component: NftOptions,
  argTypes: {
    onRemove: {
      control: 'onRemove',
    },
    onViewOnOpensea: {
      control: 'onViewOnOpensea',
    },
  },

};

export const DefaultStory = (args) => <NftOptions {...args} />;

DefaultStory.storyName = 'Default';