import React from 'react';
import SnapAuthorshipHeader from './snap-authorship-header';

export default {
  title: 'Components/App/Snaps/SnapAuthorshipHeader',
  component: SnapAuthorshipHeader,
  argTypes: {
    snapId: {
      control: 'text',
    },
  },
};

export const DefaultStory = (args) => <SnapAuthorshipHeader {...args} />;

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  snapId: 'npm:@metamask/test-snap-bip44',
};
