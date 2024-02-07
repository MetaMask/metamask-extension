import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import NetworkToggle from './network-toggle';

export default {
  title: 'Components/App/IncomingTransactionToggle/NetworkToggle',
  component: NetworkToggle,
  argTypes: {
    chainId: {
      control: 'text',
    },
    networkPreferences: {
      control: 'object',
    },
    toggleSingleNetwork: {
      action: 'toggleSingleNetwork',
    },
  },
  args: {
    networkPreferences: {
      isShowIncomingTransactions: true,
      label: 'Ethereum or long network name',
      imageUrl: './images/ethereum.svg',
    },
    chainId: '0x1',
  },
} as Meta<typeof NetworkToggle>;

export const DefaultStory: StoryFn<typeof NetworkToggle> = (args) => (
  <NetworkToggle {...args} />
);

DefaultStory.storyName = 'Default';
