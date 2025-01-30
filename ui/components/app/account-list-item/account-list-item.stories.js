import React from 'react';
import { EthAccountType } from '@metamask/keyring-api';
import { ETH_EOA_METHODS } from '../../../../shared/constants/eth-methods';
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
  id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
  metadata: {
    name: 'Account 2',
    keyring: {
      type: 'HD Key Tree',
    },
  },
  options: {},
  methods: ETH_EOA_METHODS,
  type: EthAccountType.Eoa,
  address: '0xb19ac54efa18cc3a14a5b821bfec73d284bf0c5e',
  balance: '0x2d3142f5000',
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
