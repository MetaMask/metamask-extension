import React from 'react';
import NftDefaultImage from '.';

export default {
  title: 'Components/App/NftDefaultImage',

  argTypes: {
    clickable: {
      control: 'boolean',
    },
  },
};

export const DefaultStory = (args) => (
  <div style={{ width: 200, height: 200 }}>
    <NftDefaultImage {...args} />
  </div>
);

DefaultStory.storyName = 'Default';
