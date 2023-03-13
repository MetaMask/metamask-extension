import React from 'react';
import { MultichainTokenListItem } from './multichain-token-list-item';

export default {
  title: 'Components/Multichain/MultichainTokenListItem',
  component: MultichainTokenListItem,
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

export const DefaultStory = (args) => <MultichainTokenListItem {...args} />;

DefaultStory.storyName = 'Default';
