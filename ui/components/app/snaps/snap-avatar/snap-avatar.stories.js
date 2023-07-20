import React from 'react';
import SnapAvatar from '.';

export default {
  title: 'Components/App/Snaps/SnapAvatar',

  component: SnapAvatar,
  argTypes: {
    snapId: {
      control: 'text',
    },
  },
};

export const DefaultStory = (args) => <SnapAvatar {...args} />;

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  snapId: 'npm:@metamask/test-snap-bip44',
};
