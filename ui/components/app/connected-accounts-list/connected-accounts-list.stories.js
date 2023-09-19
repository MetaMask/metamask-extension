import React from 'react';
import ConnectedAccountsList from '.';

export default {
  title: 'Components/App/ConnectedAccountsList',

  argTypes: {
    connectedAccounts: {
      control: 'array',
    },
    setSelectedAccount: {
      control: 'text',
    },
    shouldRenderListOptions: {
      control: 'boolean',
    },
  },
  args: {
    connectedAccounts: [
      {
        id: 'mock-id',
        address: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
        balance: '0x176e5b6f173ebe66',
        metadata: {
          name: 'This is a Really Long Account Name',
          keyring: {
            type: 'HD Key Tree',
          },
        },
        options: {},
        methods: [
          'personal_sign',
          'eth_sign',
          'eth_signTransaction',
          'eth_signTypedData_v1',
          'eth_signTypedData_v3',
          'eth_signTypedData_v4',
        ],
        type: 'eip155:eoa',
      },
      {
        id: 'mock-id-2',
        address: '0xb19ac54efa18cc3a14a5b821bfec73d284bf0c5e',
        balance: '0x2d3142f5000',
        metadata: {
          name: 'Account 2',
          keyring: {
            type: 'HD Key Tree',
          },
        },
        options: {},
        methods: [
          'personal_sign',
          'eth_sign',
          'eth_signTransaction',
          'eth_signTypedData_v1',
          'eth_signTypedData_v3',
          'eth_signTypedData_v4',
        ],
        type: 'eip155:eoa',
      },
    ],
  },
};

export const DefaultStory = (args) => <ConnectedAccountsList {...args} />;

DefaultStory.storyName = 'Default';
