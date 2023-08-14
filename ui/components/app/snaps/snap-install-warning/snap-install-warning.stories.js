import React from 'react';
import SnapInstallWarning from './snap-install-warning';

export default {
  title: 'Components/App/snaps/SnapInstallWarning',
  component: SnapInstallWarning,
  argTypes: {
    onCancel: {
      action: 'onCancel',
    },
    onSubmit: {
      action: 'onSubmit',
    },
    warnings: {
      control: 'array',
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
    warnings: [
      { message: 'Warning 1', id: '1' },
      { message: 'Warning 2', id: '2' },
      { message: 'Warning 3', id: '3' },
      { message: 'Warning 4', id: '4' },
      { message: 'Warning 5', id: '5' },
      { message: 'Warning 6', id: '6' },
      { message: 'Warning 7', id: '7' },
      { message: 'Warning 8', id: '8' },
    ],
  },
};

export const DefaultStory = (args) => <SnapInstallWarning {...args} />;

DefaultStory.storyName = 'Default';
