import React from 'react';
import { AccountNetworkIndicator } from './account-network-indicator';

const defaultStory = {
  title: 'Components/Multichain/AccountNetworkIndicator',
  component: AccountNetworkIndicator,
  argTypes: {
    scopes: {
      control: { type: 'array' },
      description: 'Array of network scopes in CAIP format',
      table: {
        type: { summary: 'string[]' },
        defaultValue: { summary: '["eip155:0"]' },
      },
    },
  },
  args: {
    scopes: ['eip155:0', 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'],
  },
};

export default defaultStory;

export const DefaultStory = (args: { scopes: string[] }) => (
  <AccountNetworkIndicator {...args} />
);
DefaultStory.storyName = 'Default';
