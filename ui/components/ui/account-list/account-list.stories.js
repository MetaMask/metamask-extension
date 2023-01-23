import React from 'react';
import AccountList from '.';

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
    accounts: [
      {
        address: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
        addressLabel: 'Account 1',
        lastConnectedDate: 'Feb-22-2022',
        balance: '8.7a73149c048545a3fe58',
        has: () => {
          /**  nothing to do */
        },
      },
    ],
    selectedAccounts: {
      address: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
      addressLabel: 'Account 2',
      lastConnectedDate: 'Feb-22-2022',
      balance: '8.7a73149c048545a3fe58',
      has: () => {
        /** nothing to do */
      },
    },
    addressLastConnectedMap: {
      '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4': 'Feb-22-2022',
    },
    allAreSelected: () => true,
    nativeCurrency: 'USD',
  },
};

export const DefaultStory = (args) => <AccountList {...args} />;

DefaultStory.storyName = 'Default';
