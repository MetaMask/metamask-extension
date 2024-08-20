import React from 'react';
import { Meta } from 'storybook';

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
} as Meta;

const Template = (args: any) => <TokenList {...args} />;

export const Default = Template.bind({});
Default.args = {
  results: [
    {
      symbol: 'ABC',
      name: 'ABC Token',
      address: '0xabcdef1234567890',
      iconUrl: 'https://example.com/abc.png',
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
