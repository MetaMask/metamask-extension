import React from 'react';
import SnapsAuthorshipPill from '.';

export default {
  title: 'Components/App/Flask/SnapsAuthorshipPill',

  component: SnapsAuthorshipPill,
  argTypes: {
    snapId: {
      control: 'text',
    },
  },
};

export const DefaultStory = (args) => <SnapsAuthorshipPill {...args} />;

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  snapId: 'npm:@metamask/test-snap-bip44',
};
