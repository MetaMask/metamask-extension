import React from 'react';
import KeyringSnapRemovalWarning from './keyring-snap-removal-warning';

export default {
  title: 'Components/App/Snaps/KeyringSnapRemovalWarning',
  component: KeyringSnapRemovalWarning,
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
    snapUrl: {
      control: 'text',
    },
    isOpen: {
      control: 'boolean',
    },
    keyringAccounts: {
      control: 'array',
    },
  },
  args: {
    snapName: 'ABC Snap',
    snapUrl: 'mock-url',
    isOpen: true,
    keyringAccounts: [
      {
        address: '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b',

        name: 'Test Account 2',
      },
    ],
  },
};

export const DefaultStory = (args) => <KeyringSnapRemovalWarning {...args} />;

DefaultStory.storyName = 'Default';
