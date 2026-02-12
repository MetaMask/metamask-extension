import React from 'react';
import type { Meta, StoryFn } from '@storybook/react';
import AccountList from './account-list';

export default {
  title: 'Pages/CreateAccount/ConnectHardware/AccountList',
  component: AccountList,

  argTypes: {
    onPathChange: {
      action: 'onPathChange',
    },
    selectedPath: { control: 'text' },
    device: { control: 'text' },
    accounts: {
      control: 'object',
    },
    connectedAccounts: {
      control: 'object',
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
      control: 'object',
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
      control: 'object',
    },
  },
  args: {
    selectedPath: `m/44'/60'/0'/0`,
    device: 'trezor',
    accounts: [
      {
        name: 'This is a Really Long Account Name',
        address: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
        index: 0,
        balance: '0x176e5b6f173ebe66',
      },
    ],
    connectedAccounts: [
      '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
    ],
    chainId: '0x1',
    rpcPrefs: {},
    selectedAccounts: [],
    hdPaths: {
      ledger: [
        { name: 'Ledger Live', value: `m/44'/60'/0'/0/0` },
        { name: 'Legacy (MEW / MyCrypto)', value: `m/44'/60'/0'` },
        {
          name: `BIP44 Standard (e.g. MetaMask, Trezor)`,
          value: `m/44'/60'/0'/0`,
        },
      ],
      trezor: [
        { name: `BIP44 Standard (e.g. MetaMask, Trezor)`, value: `m/44'/60'/0'/0` },
        { name: `Legacy (Ledger / MEW / MyCrypto)`, value: `m/44'/60'/0'` },
        { name: `Trezor Testnets`, value: `m/44'/1'/0'/0` },
      ],
      lattice: [],
      oneKey: [],
    },
  },
} as Meta<typeof AccountList>;

export const DefaultStory: StoryFn<typeof AccountList> = (args) => (
  <AccountList {...args} />
);

DefaultStory.storyName = 'Default';
