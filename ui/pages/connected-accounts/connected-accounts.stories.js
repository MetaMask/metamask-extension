import React from 'react';
import { action } from '@storybook/addon-actions';
import ConnectedAccounts from './connected-accounts.component';

export default {
  title: 'Pages/ConnectedAccounts',
};

const accounts = [
  {
    address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
    id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
    metadata: {
      keyring: {
        type: 'HD Key Tree',
      },
    },
    name: 'Account 1',
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
];

export const DefaultStory = () => {
  return (
    <ConnectedAccounts
      connectedAccounts={accounts}
      activeTabOrigin="https://metamask.github.io"
      accountToConnect={accounts[0]}
      connectAccount={action('Account Connected')}
      removePermittedAccount={action('Account Removed')}
      setSelectedAddress={action('Selected Address Changed')}
    />
  );
};

DefaultStory.storyName = 'Default';
