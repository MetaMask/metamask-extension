import React from 'react';
import NftDefaultImage from '.';

export default {
  title: 'Components/App/NftDefaultImage',

  argTypes: {
    name: {
      control: 'text',
    },
    tokenId: {
      control: 'text',
    },
    clickable: {
      control: 'boolean',
    },
  },
  args: {
    name: null,
    tokenId: '12345',
    clickable: true,
  },
};

export const DefaultStory = (args) => (
  <div style={{ width: 200, height: 200 }}>
    <NftDefaultImage {...args} />
  </div>
);

DefaultStory.storyName = 'Default';
