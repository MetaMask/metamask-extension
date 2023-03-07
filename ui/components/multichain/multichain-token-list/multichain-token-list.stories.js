import React from 'react';
import { MultichainTokenList } from './multichain-token-list';

export default {
  title: 'Components/Multichain/MultichainTokenList',
  component: MultichainTokenList,
  argTypes: {
    tokenSymbol: {
      control: 'text',
    },
    tokenImage: {
      control: 'text',
    },
    primary: {
      control: 'text',
    },
    secondary: {
      control: 'text',
    },
  },
  args: {
    secondary: '$9.80 USD',
    primary: '0.006',
    tokenImage: './images/eth_logo.svg',
    tokenSymbol: 'ETH',
  },
};

export const DefaultStory = (args) => <MultichainTokenList {...args} />;

DefaultStory.storyName = 'Default';
