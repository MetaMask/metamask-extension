import React from 'react';
import README from './README.mdx';
import AccountListItem from './account-list-item';

export default {
  title: 'Components/App/AccountListItem',

  component: AccountListItem,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    account: {
      control: 'object',
    },
    className: { control: 'text' },
    displayAddress: { control: 'boolean' },
    handleClick: { action: 'handleClick' },
  },
};

const account = {
  address: '0xb19ac54efa18cc3a14a5b821bfec73d284bf0c5e',
  balance: '0x2d3142f5000',
  metadata: {
    name: 'Account 2',
    keyring: {
      type: 'HD Key Tree',
    },
  },
  options: {},
  methods: [
    'personal_sign',
    'eth_sign',
    'eth_signTransaction',
    'eth_signTypedData',
    'eth_signTypedData_v1',
    'eth_signTypedData_v3',
    'eth_signTypedData_v4',
  ],
  type: 'eip155:eoa',
};

export const DefaultStory = (args) => {
  return <AccountListItem {...args} />;
};

DefaultStory.storyName = 'Default';
DefaultStory.args = {
  account,
  displayAddress: false,
};

DefaultStory.storyName = 'Default';
