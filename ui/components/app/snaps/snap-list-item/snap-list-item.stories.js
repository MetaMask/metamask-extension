import React from 'react';
import SnapSettingsCard from '.';

export default {
  title: 'Components/App/Snaps/SnapSettingsCard',
  component: SnapSettingsCard,
  argTypes: {
    name: {
      control: 'text',
    },
    packageName: {
      control: 'text',
    },
    onClick: {
      action: 'onClick',
    },
    snapId: {
      control: 'text',
    },
  },
  args: {
    name: 'Snap Name',
    packageName: 'Snap Package Name',
    snapId: 'npm:@metamask/test-snap-bip44',
  },
};

export const DefaultStory = (args) => <SnapSettingsCard {...args} />;

DefaultStory.storyName = 'Default';
