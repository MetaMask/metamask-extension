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
        id: '07c2cfec-36c9-46c4-8115-3836d3ac9047',
        metadata: {
          name: 'Test Account 2',
          keyring: {
            type: 'HD Key Tree',
          },
        },
        options: {},
        supportedMethods: [
          'personal_sign',
          'eth_sign',
          'eth_signTransaction',
          'eth_signTypedData',
          'eth_signTypedData_v1',
          'eth_signTypedData_v3',
          'eth_signTypedData_v4',
        ],
        type: 'eip155:eoa',
      },
    ],
  },
};

export const DefaultStory = (args) => <KeyringSnapRemovalWarning {...args} />;

DefaultStory.storyName = 'Default';
