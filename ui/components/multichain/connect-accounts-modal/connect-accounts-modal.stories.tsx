import React from 'react';
import { ConnectAccountsModalList } from './connect-accounts-modal-list';

export default {
  title: 'Components/Multichain/ConnectAccountsModal',
  component: ConnectAccountsModalList,
  argTypes: {
    onClose: {
      action: 'onClose',
    },
  },
  args: {
    onClose: () => ({}),
    onAccountsUpdate: () => ({}),
    handleAccountClick: () => ({}),
    deselectAll: () => ({}),
    selectAll: () => ({}),
    allAreSelected: () => false,
    checked: false,
    isIndeterminate: false,
    accounts: [
      {
        address: '0x5Ab19e7091dD208F352F8E727B6DCC6F8aBB6275',
        id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
        metadata: {
          name: 'Custody Account A',
          keyring: {
            type: 'Custody',
          },
        },
        options: {},
        scopes: ['eip155:0'],
        type: 'eip155:eoa',
      },
    ],
    selectedAccounts: [],
  },
};

export const DefaultStory = (args) => <ConnectAccountsModalList {...args} />;
DefaultStory.storyName = 'Default';
