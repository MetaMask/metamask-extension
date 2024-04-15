import React from 'react';
import { AccountListItemMenu } from '.';

export default {
  title: 'Components/Multichain/AccountListItemMenu',
  component: AccountListItemMenu,
  argTypes: {
    anchorElement: {
      control: 'window.Element',
    },
    onClose: {
      action: 'onClose',
    },
    closeMenu: {
      action: 'closeMenu',
    },
    isRemovable: {
      control: 'boolean',
    },
    identity: {
      control: 'object',
    },
    isOpen: {
      control: 'boolean',
    },
  },
  args: {
    anchorElement: null,
    identity: {
      address: '0xb19ac54efa18cc3a14a5b821bfec73d284bf0c5e',
      id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
      metadata: {
        name: 'Account 1',
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
      balance: '0x152387ad22c3f0',
      tokenBalance: '32.09 ETH',
    },
    isRemovable: true,
    isOpen: true,
  },
};

export const DefaultStory = (args) => <AccountListItemMenu {...args} />;
DefaultStory.storyName = 'Default';
