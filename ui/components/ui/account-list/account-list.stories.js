import React from 'react';
import { createMockInternalAccount } from '../../../../test/jest/mocks';
import AccountList from '.';

const account1 = {
  ...createMockInternalAccount({
    address: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
    name: 'Account 1',
  }),
  addressLabel: 'Account 1 (0xbc641...29713)',
  lastConnectedDate: 'Feb-22-2022',
  balance: '8.7a73149c048545a3fe58',
  has: () => {
    /**  nothing to do */
  },
};

const account2 = {
  ...createMockInternalAccount({
    address: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
    name: 'Very long account name',
  }),
  addressLabel: 'Very long account name (0xb366c...015ba)',
  lastConnectedDate: 'Feb-22-2022',
  balance: '0x1bc16d674ec80000',
  has: () => {
    /**  nothing to do */
  },
};

const account3 = {
  ...createMockInternalAccount({
    address: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
    name: 'DeFi Account',
  }),
  addressLabel: 'DeFi Account (0xb366c...015ba)',
  lastConnectedDate: 'Feb-22-2022',
  balance: '0x2bc16d674ec80000',
  has: () => {
    /**  nothing to do */
  },
};

const account4 = {
  ...createMockInternalAccount({
    address: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
    name: 'Gaming Account',
  }),
  addressLabel: 'Gaming Account (0xb366c...015ba)',
  lastConnectedDate: 'Feb-22-2022',
  balance: '0x12c16d674ec80000',
  has: () => {
    /**  nothing to do */
  },
};

export default {
  title: 'Components/UI/AccountList', // title should follow the folder structure location of the component. Don't use spaces.

  argTypes: {
    accounts: {
      control: 'object',
    },
    selectNewAccountViaModal: {
      action: 'selectNewAccountViaModal',
    },
    addressLastConnectedMap: {
      control: 'object',
    },
    nativeCurrency: {
      control: 'text',
    },
    selectedAccounts: {
      control: 'object',
    },
    allAreSelected: {
      action: 'allAreSelected',
    },
    deselectAll: {
      action: 'deselectAll',
    },
    selectAll: {
      action: 'selectAll',
    },
    handleAccountClick: {
      action: 'handleAccountClick',
    },
  },
  args: {
    accounts: [account1, account2, account3, account4],
    selectedAccounts: new Set(['0x64a845a5b02460acf8a3d84503b0d68d028b4bb4']),
    addressLastConnectedMap: {
      '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4': 'Feb-22-2022',
    },
    allAreSelected: () => true,
    nativeCurrency: 'USD',
  },
};

export const DefaultStory = (args) => <AccountList {...args} />;

DefaultStory.storyName = 'Default';
