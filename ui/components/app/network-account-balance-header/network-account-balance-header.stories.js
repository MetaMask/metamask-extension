import React from 'react';
import NetworkAccountBalanceHeader from './network-account-balance-header';

export default {
  title: 'Components/App/NetworkAccountBalanceHeader',

  argTypes: {
    networkName: {
      control: { type: 'text' },
    },
    accountName: {
      control: { type: 'text' },
    },
    accountBalance: {
      control: { type: 'text' },
    },
    tokenName: {
      control: { type: 'text' },
    },
    accountAddress: {
      control: { type: 'text' },
    },
  },
  args: {
    networkName: 'Ethereum Network',
    accountName: 'Account 1',
    accountBalance: '200.12',
    tokenName: 'DAI',
    accountAddress: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
  },
};

export const DefaultStory = (args) => {
  return <NetworkAccountBalanceHeader {...args} />;
};

DefaultStory.storyName = 'Default';
