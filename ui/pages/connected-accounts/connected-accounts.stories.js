import React from 'react';
import { action } from '@storybook/addon-actions';
import { EthAccountType, EthMethod } from '@metamask/keyring-api';
import ConnectedAccounts from './connected-accounts.component';

export default {
  title: 'Pages/ConnectedAccounts',
};

const accounts = [
  {
    address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
    id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
    metadata: {
      name: 'Account 1',
      keyring: {
        type: 'HD Key Tree',
      },
    },
    options: {},
    methods: [...Object.values(EthMethod)],
    type: EthAccountType.Eoa,
  },
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
    methods: [...Object.values(EthMethod)],
    type: EthAccountType.Eoa,
  },
];

export const DefaultStory = () => {
  return (
    <ConnectedAccounts
      connectedAccounts={accounts}
      activeTabOrigin="https://metamask.github.io"
      accountToConnect={accounts[0]}
      connectAccount={action('Account Connected')}
      removePermittedAccount={action('Account Removed')}
      setSelectedAccount={action('Selected Account Changed')}
    />
  );
};

DefaultStory.storyName = 'Default';
