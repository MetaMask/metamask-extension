import React from 'react';
import SnapAuthorshipExpanded from './snap-authorship-expanded';

export default {
  title: 'Components/App/Snaps/SnapAuthorshipExpanded',
  component: SnapAuthorshipExpanded,
  argTypes: {
    snapId: {
      control: 'text',
    },
    className: {
      control: 'text',
    },
    snap: {
      control: 'object',
    },
  },
  args: {
    snapId: 'npm:@metamask/test-snap-bip44',
    className: '',
    snap: {
      enabled: true,
      id: 'some-id',
      version: '1.0.0',
    },
  },
};

export const DefaultStory = (args) => <SnapAuthorshipExpanded {...args} />;

DefaultStory.storyName = 'Default';
