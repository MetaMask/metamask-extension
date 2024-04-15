import React from 'react';
import testData from '../../../../.storybook/test-data';
import { AccountDetails } from '.';

const { address } = Object.values(
  testData.metamask.internalAccounts.accounts,
)[1];

export default {
  title: 'Components/Multichain/AccountDetails',
  component: AccountDetails,
  argTypes: {
    address: {
      control: 'text',
    },
  },
  args: {
    address,
  },
};

export const DefaultStory = (args) => <AccountDetails {...args} />;
