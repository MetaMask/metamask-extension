import React from 'react';
import AccountList from './account-list';

export default {
  title: 'Pages/CreateAccount/ConnectHardware/AccountList',

  argTypes: {
    onPathChange: {
      action: 'onPathChange',
    },
    selectedPath: 'selectedPath',
    device: 'device',
    accounts: {
      control: 'array',
    },
    connectedAccounts: {
      control: 'array',
    },
    onAccountChange: {
      action: 'onAccountChange',
    },
    onForgetDevice: {
      action: 'onForgetDevice',
    },
    getPage: {
      action: 'getPage',
    },
    chainId: {
      control: 'text',
    },
    rpcPrefs: {
      control: 'object',
    },
    selectedAccounts: {
      control: 'array',
    },
    onUnlockAccounts: {
      action: 'onUnlockAccounts',
    },
    onCancel: {
      action: 'onCancel',
    },
    onAccountRestriction: {
      action: 'onAccountRestriction',
    },
    hdPaths: {
      control: 'array',
    },
  },
  args: {
    selectedPath: 'selectedPath',
    device: 'device',
    accounts: [
      {
        name: 'This is a Really Long Account Name',
        address: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
        index: 0,
        balance: '0x176e5b6f173ebe66',
      },
    ],
    connectedAccounts: [
      {
        name: 'This is a Really Long Account Name',
        address: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
        index: 0,
        balance: '0x176e5b6f173ebe66',
      },
    ],
    chainId: 'chainId',
    rpcPrefs: {},
    selectedAccounts: [
      {
        name: 'This is a Really Long Account Name',
        address: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
        index: 0,
        balance: '0x176e5b6f173ebe66',
      },
    ],
    hdPaths: [
      { name: 'Ledger Live', value: `m/44'/60'/0'/0/0` },
      { name: 'Legacy (MEW / MyCrypto)', value: `m/44'/60'/0'` },
      {
        name: `BIP44 Standard (e.g. MetaMask, Trezor)`,
        value: `m/44'/60'/0'/0`,
      },
    ],
  },
};

export const DefaultStory = (args) => <AccountList {...args} />;

DefaultStory.storyName = 'Default';
