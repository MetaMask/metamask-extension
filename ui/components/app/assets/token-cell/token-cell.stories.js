import React from 'react';
import TokenCell from './token-cell';

export default {
  title: 'Components/App/Assets/TokenCell',
  argTypes: {
    address: {
      control: 'text',
    },
    symbol: {
      control: 'text',
    },
    string: {
      control: 'text',
    },
    onClick: {
      action: 'onClick',
    },
    image: {
      control: 'text',
    },
  },
  args: {
    token: {
      address: '0xAnotherToken',
      symbol: 'TEST',
      string: '5.000',
      currentCurrency: 'usd',
      image: '',
      chainId: '0x1',
      tokenFiatAmount: 5,
      aggregators: [],
      decimals: 18,
      isNative: false,
    },
  },
};

export const DefaultStory = (args) => <TokenCell {...args} />;

DefaultStory.storyName = 'Default';
