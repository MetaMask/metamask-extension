import React from 'react';
import testData from '../../../../.storybook/test-data';
import { AccountDetails } from '.';

const [, accountId] = Object.keys(testData.metamask.internalAccounts.accounts);

export default {
  title: 'Components/Multichain/AccountDetails',
  component: AccountDetails,
  argTypes: {
    accountId: {
      control: 'text',
    },
  },
  args: {
    accountId,
  },
};

export const DefaultStory = (args) => <AccountDetails {...args} />;
