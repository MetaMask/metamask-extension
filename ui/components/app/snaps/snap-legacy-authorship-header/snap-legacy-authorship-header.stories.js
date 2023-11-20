import React from 'react';
import SnapLegacyAuthorshipHeader from './snap-legacy-authorship-header';

export default {
  title: 'Components/App/Snaps/SnapLegacyAuthorshipHeader',

  component: SnapLegacyAuthorshipHeader,
  argTypes: {
    snapId: {
      control: 'text',
    },
  },
};

export const DefaultStory = (args) => <SnapLegacyAuthorshipHeader {...args} />;

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  snapId: 'npm:@metamask/test-snap-bip44',
};
