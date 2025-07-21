import React from 'react';
import testData from '../../../../.storybook/test-data';
import { AccountDetails } from '.';

const UPGRADED_ACCOUNT_MOCK = '0x9d0ba4ddac06032527b140912ec808ab9451b788';

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

DefaultStory.storyName = 'Default';

export const UpgradedAccountStory = (args) => (
  <AccountDetails {...args} address={UPGRADED_ACCOUNT_MOCK} />
);

UpgradedAccountStory.storyName = 'Upgraded Account';
