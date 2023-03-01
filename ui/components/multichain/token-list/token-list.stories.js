import React from 'react';
import { NewTokenList } from './token-list';

export default {
  title: 'Components/Redesign/NewTokenList',
  component: NewTokenList,
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

export const DefaultStory = (args) => <NewTokenList {...args} />;

DefaultStory.storyName = 'Default';
