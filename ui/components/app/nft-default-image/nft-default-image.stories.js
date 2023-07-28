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
    isIpfsEnabled: {
      control: 'text',
    },
  },
  args: {
    name: null,
    tokenId: '12345',
    clickable: true,
    isIpfsEnabled: 'dweb.link',
  },
};

export const DefaultStory = (args) => (
  <div style={{ width: 200, height: 200 }}>
    <NftDefaultImage {...args} />
  </div>
);

DefaultStory.storyName = 'Default';

export const NoImage = (args) => {
  return (
    <div style={{ width: 200, height: 200 }}>
      <NftDefaultImage {...args} />
    </div>
  );
};

NoImage.args = {
  isIpfsEnabled: '',
};
