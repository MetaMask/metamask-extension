import React from 'react';
import SnapAuthorshipPill from './snap-authorship-pill'

export default {
  title: 'Components/App/Snaps/SnapAuthorshipPill',
  component: SnapAuthorshipPill,
  argTypes: {
    snapId: {
      control: 'text',
    },
  },
};

export const DefaultStory = (args) => <SnapAuthorshipPill {...args} />;

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  snapId: 'npm:@metamask/test-snap-bip44',
};
