import React from 'react';
import SnapRemoveWarning from './snap-remove-warning';

export default {
  title: 'Components/App/Snaps/SnapRemoveWarning',
  component: SnapRemoveWarning,
  argTypes: {
    onCancel: {
      action: 'onCancel',
    },
    onSubmit: {
      action: 'onSubmit',
    },
    snapName: {
      control: 'text',
    },
    isOpen: {
      control: 'boolean',
    },
  },
  args: {
    snapName: 'Snap Name',
    isOpen: true,
  },
};

export const DefaultStory = (args) => <SnapRemoveWarning {...args} />;

DefaultStory.storyName = 'Default';
