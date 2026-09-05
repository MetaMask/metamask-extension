import React from 'react';
import KeyringSnapRemovalWarning from './keyring-snap-removal-warning';

const mockSnap = {
  id: 'mock-snap-id',
  manifest: {
    proposedName: 'ABC Snap',
  },
};

export default {
  title: 'Components/App/Snaps/KeyringSnapRemovalWarning',
  component: KeyringSnapRemovalWarning,
  argTypes: {
    onCancel: {
      action: 'onCancel',
    },
    onClose: {
      action: 'onClose',
    },
    onSubmit: {
      action: 'onSubmit',
    },
    onBack: {
      action: 'onBack',
    },
    isOpen: {
      control: 'boolean',
    },
    keyringAccounts: {
      control: 'array',
    },
  },
  args: {
    snap: mockSnap,
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
