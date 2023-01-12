import React from 'react';
import CollectibleDefaultImage from '.';

export default {
  title: 'Components/App/CollectibleDefaultImage',
  id: __filename,
  argTypes: {
    name: {
      control: 'text',
    },
    tokenId: {
      control: 'text',
    },
    handleImageClick: {
      action: 'handleImageClick',
    },
    handleImageKeyPress: {
      action: 'handleImageKeyPress',
    },
  },
  args: {
    name: null,
    tokenId: '12345',
    handleImageClick: null,
    handleImageKeyPress: null,
  },
};

export const DefaultStory = (args) => (
  <div style={{ width: 200, height: 200 }}>
    <CollectibleDefaultImage {...args} />
  </div>
);

DefaultStory.storyName = 'Default';

export const HandleImageClick = (args) => (
  <div style={{ width: 200, height: 200 }}>
    <CollectibleDefaultImage {...args} />
  </div>
);

HandleImageClick.args = {
  // eslint-disable-next-line no-alert
  handleImageClick: () => window.alert('CollectibleDefaultImage clicked!'),
  handleImageKeyPress: () =>
    // eslint-disable-next-line no-alert
    window.alert('CollectibleDefaultImage clicked via key press!'),
};
