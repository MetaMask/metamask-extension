import React from 'react';
import { AccountNetworkIndicator } from './account-network-indicator';

const mockAccount = {
  address: '0x1234567890abcdef1234567890abcdef12345678',
  scopes: [
    'eip155:0',
    'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
  ] as `${string}:${string}`[],
  type: 'eip155:eoa' as const,
  id: 'mock-id',
  options: {},
  metadata: {
    name: 'Test Account',
    importTime: Date.now(),
    keyring: { type: 'HD Key Tree' },
  },
  pinned: false,
  hidden: false,
  lastSelected: 0,
  active: 0,
  balance: '0x0',
  keyring: { type: 'HD Key Tree' },
  label: null,
  methods: [],
};

const defaultStory = {
  title: 'Components/Multichain/AccountNetworkIndicator',
  component: AccountNetworkIndicator,
  argTypes: {
    account: {
      control: { type: 'object' },
      description: 'Account object',
      table: {
        type: { summary: 'Account' },
      },
    },
  },
  args: {
    account: mockAccount,
  },
};

export default defaultStory;

export const DefaultStory = (args: { account: typeof mockAccount }) => {
  return <AccountNetworkIndicator {...args} />;
};

DefaultStory.storyName = 'Default';
