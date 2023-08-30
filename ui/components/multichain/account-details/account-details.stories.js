import React from 'react';
import testData from '../../../../.storybook/test-data';
import { AccountDetails } from '.';

const [, address] = Object.keys(testData.metamask.identities);

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
