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
    keyringAccounts: {
      control: 'array',
    },
  },
  args: {
    snapName: 'ABC Snap',
    isOpen: true,
    keyringAccounts: [],
  },
};

export const DefaultStory = (args) => <SnapRemoveWarning {...args} />;

DefaultStory.storyName = 'Default';

export const KeyringSnapRemoval = {
  render: (args) => (
    <SnapRemoveWarning
      {...args}
      keyringAccounts={[
        {
          address: '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b',
          id: '07c2cfec-36c9-46c4-8115-3836d3ac9047',
          metadata: {
            keyring: {
              type: 'HD Key Tree',
            },
          },
          name: 'Test Account 2',
          options: {},
          supportedMethods: [
            'personal_sign',
            'eth_sendTransaction',
            'eth_sign',
            'eth_signTransaction',
            'eth_signTypedData',
            'eth_signTypedData_v1',
            'eth_signTypedData_v2',
            'eth_signTypedData_v3',
            'eth_signTypedData_v4',
          ],
          type: 'eip155:eoa',
        },
      ]}
    />
  ),
};
