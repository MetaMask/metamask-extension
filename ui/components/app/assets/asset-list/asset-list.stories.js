import React from 'react';
import AssetList from '.';

export default {
  title: 'Components/App/Assets/AssetList',
  argTypes: {
    onClickAsset: {
      control: 'onClickAsset',
    },
  },
  args: {
    onClickAsset: () => console.log('onClickAsset fired'),
  },
};

export const DefaultStory = (args) => <AssetList {...args} />;

DefaultStory.storyName = 'Default';
