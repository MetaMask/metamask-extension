import React from 'react';
import testData from '../../../../.storybook/test-data';
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
    account: {
      control: 'object',
    },
    isOpen: {
      control: 'boolean',
    },
  },
  args: {
    anchorElement: null,
    account: {
      ...testData.metamask.internalAccounts.accounts[
        Object.keys(testData.metamask.internalAccounts.accounts)[0]
      ],
      balance: '0x152387ad22c3f0',
      tokenBalance: '32.09 ETH',
    },
    isRemovable: true,
    isOpen: true,
  },
};

export const DefaultStory = (args) => <AccountListItemMenu {...args} />;
DefaultStory.storyName = 'Default';
