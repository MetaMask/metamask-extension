import React from 'react';
import { PermissionDetailsModal } from '.';

export default {
  title: 'Components/Multichain/PermissionDetailsModal',
  component: PermissionDetailsModal,
  argTypes: {
    onClose: { action: 'onClose' },
    onClick: { action: 'onClose' },
  },
  args: {
    account: {
      address: 'mockAddress',
      balance: 'mockBalance',
      id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
      metadata: {
        name: 'mockName',
        keyring: {
          type: 'HD Key Tree',
        },
      },
      label: '',
    },
    permissions: [
      {
        key: 'eth_accounts',
        value: {
          caveats: [
            {
              type: 'restrictReturnedAccounts',
              value: ['0xd8ad671f1fcc94bcf0ebc6ec4790da35e8d5e1e1'],
            },
          ],
          date: 1710853457632,
          id: '5yj8do_LYnLHstT0tWjdu',
          invoker: 'https://app.uniswap.org',
          parentCapability: 'eth_accounts',
        },
      },
    ],
    onClick: () => undefined,
    onClose: () => undefined,
    isOpen: true,
  },
};

export const DefaultStory = (args) => <PermissionDetailsModal {...args} />;

DefaultStory.storyName = 'Default';
