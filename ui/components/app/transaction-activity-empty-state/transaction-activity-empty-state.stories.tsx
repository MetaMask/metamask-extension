import type { Meta, StoryObj } from '@storybook/react';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { TransactionActivityEmptyState } from './transaction-activity-empty-state';

const mockAccount: InternalAccount = {
  id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
  address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
  type: 'eip155:eoa',
  options: {},
  scopes: ['eip155:1'],
  methods: [
    'personal_sign',
    'eth_sign',
    'eth_signTransaction',
    'eth_signTypedData_v1',
    'eth_signTypedData_v3',
    'eth_signTypedData_v4',
  ],
  metadata: {
    name: 'Account 1',
    keyring: { type: 'HD Key Tree' },
    importTime: Date.now(),
  },
};

const meta: Meta<typeof TransactionActivityEmptyState> = {
  title: 'Components/App/TransactionActivityEmptyState',
  component: TransactionActivityEmptyState,
  args: {
    account: mockAccount,
  },
};

export default meta;
type Story = StoryObj<typeof TransactionActivityEmptyState>;

export const Default: Story = {};
