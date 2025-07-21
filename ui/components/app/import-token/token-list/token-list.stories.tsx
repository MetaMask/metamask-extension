import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import TokenList from './token-list.component';

export default {
  title: 'Components/App/TokenList',
  component: TokenList,
  argTypes: {
    tokens: {
      control: 'array',
    },
    results: {
      control: 'array',
    },
    selectedTokens: {
      control: 'object',
    },
    onToggleToken: {
      action: 'onToggleToken',
    },
    currentNetwork: {
      control: 'object',
    },
    testNetworkBackgroundColor: {
      control: 'object',
    },
  },
} as Meta<typeof TokenList>;

const Template = (args: any) => <TokenList {...args} />;

export const Default = Template.bind({});
Default.args = {
  currentNetwork: {
    name: 'Ethereum',
    chainId: 1,
    nickname: 'Ethereum',
    rpcPrefs: {
      imageUrl: './images/eth_logo.svg',
    },
  },
  selectedTokens: {
    '0x9f9d0248bc87bee3ef76f9bb46aaaa01d80cc339': true,
  },
  results: [
    {
      symbol: 'ETH',
      name: 'Ethereum',
      address: '0x9f9d0248bc87bee3ef76f9bb46aaaa01d80cc339',
      iconUrl: './images/eth_logo.svg',
    },
    {
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      iconUrl: 'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x6b175474e89094c44da98b954eedeac495271d0f.png',
    },
    {
      symbol: 'XYZ',
      name: 'XYZ Token',
      address: '0x1234567890abcdef',
      iconUrl: 'https://example.com/xyz.png',
    },
  ],
};

export const ShowTokenListPlaceholder = Template.bind({});
