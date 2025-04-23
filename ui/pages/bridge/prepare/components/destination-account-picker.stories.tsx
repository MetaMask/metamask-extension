import React from 'react';
import { StoryFn } from '@storybook/react';
import { DestinationAccountPicker } from './destination-account-picker';
import { createMockInternalAccount } from '../../../../../test/jest/mocks';
import { InternalAccount } from '@metamask/keyring-internal-api';

export default {
  title: 'Pages/Bridge/Prepare/Components/DestinationAccountPicker',
  component: DestinationAccountPicker,
};

const mockAccounts = [
  createMockInternalAccount({
    name: 'EVM Account 1',
    keyringType: 'HD Key Tree',
  }),
  createMockInternalAccount({
    name: 'Solana Account 1',
    keyringType: 'Solana',
  }),
  createMockInternalAccount({
    name: 'EVM Account 2',
    keyringType: 'HD Key Tree',
  }),
  createMockInternalAccount({
    name: 'Solana Account 2',
    keyringType: 'Solana',
  }),
] as InternalAccount[];

const Template: StoryFn<typeof DestinationAccountPicker> = (args) => (
  <div style={{ width: '400px', height: '300px' }}>
    <DestinationAccountPicker {...args} />
  </div>
);

export const EVMAccounts = Template.bind({});
EVMAccounts.args = {
  accounts: mockAccounts,
  chainType: 'evm',
  onAccountSelect: (account) => console.log('Selected:', account),
};

export const SolanaAccounts = Template.bind({});
SolanaAccounts.args = {
  accounts: mockAccounts,
  chainType: 'solana',
  onAccountSelect: (account) => console.log('Selected:', account),
};

export const WithSelectedAccount = Template.bind({});
WithSelectedAccount.args = {
  accounts: mockAccounts,
  chainType: 'evm',
  selectedSwapToAccount: mockAccounts[0],
  onAccountSelect: (account) => console.log('Selected:', account),
};
