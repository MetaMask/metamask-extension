import React from 'react';
import SnapListItem from '.';

export default {
  title: 'Components/App/Snaps/SnapListItem',
  component: SnapListItem,
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

export const DefaultStory = (args) => <SnapListItem {...args} />;

DefaultStory.storyName = 'Default';
