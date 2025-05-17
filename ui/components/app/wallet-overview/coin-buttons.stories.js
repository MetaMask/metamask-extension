import React from 'react';
import testData from '../../../../.storybook/test-data';
import CoinButtons from './coin-buttons';

const { accounts, selectedAccount } = testData.metamask.internalAccounts;

export default {
  title: 'Components/App/WalletOverview/CoinButtons',
  args: {
    account: accounts[selectedAccount],
    chainId: '1',
    trackingLocation: 'home',
    isSwapsChain: true,
    isSigningEnabled: true,
    isBridgeChain: true,
    isBuyableChain: true,
    defaultSwapsToken: {
      symbol: 'ETH',
      name: 'Ether',
      address: '0x0000000000000000000000000000000000000000',
      decimals: 18,
      iconUrl: './images/eth_logo.svg',
      balance: '3093640202103801',
      string: '0.0031',
    },
    classPrefix: 'coin',
  },
  component: CoinButtons,
  parameters: {
    docs: {
      description: {
        component: 'A component that displays coin buttons',
      },
    },
  },
};

const Template = (args) => <CoinButtons {...args} />;

export const Default = Template.bind({});
