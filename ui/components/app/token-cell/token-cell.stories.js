import React from 'react';
import TokenListItem from '.';

export default {
  title: 'Components/App/TokenCell',
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
    address: '0xAnotherToken',
    symbol: 'TEST',
    string: '5.000',
    currentCurrency: 'usd',
    isOriginalTokenSymbol: true,
  },
};

export const DefaultStory = (args) => <TokenListItem {...args} />;

DefaultStory.storyName = 'Default';
