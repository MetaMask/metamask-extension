import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import {
  AccountGroupType,
  AccountWalletType,
  toAccountGroupId,
  toAccountWalletId,
  toMultichainAccountGroupId,
  toMultichainAccountWalletId,
} from '@metamask/account-api';
import { KeyringTypes } from '@metamask/keyring-controller';
import { AccountTreeWallets } from '../../../selectors/multichain-accounts/account-tree.types';
import { AccountManagementList } from './account-management-list';

const createMockWallets = (): AccountTreeWallets => {
  const srpWalletId = toMultichainAccountWalletId('srp-1');
  const srpGroup0Id = toMultichainAccountGroupId(srpWalletId, 0);
  const srpGroup1Id = toMultichainAccountGroupId(srpWalletId, 1);
  const srpGroup2Id = toMultichainAccountGroupId(srpWalletId, 2);

  const ledgerWalletId = toAccountWalletId(
    AccountWalletType.Keyring,
    KeyringTypes.ledger,
  );
  const ledgerGroup0Id = toAccountGroupId(ledgerWalletId, '0');

  const simpleKeyWalletId = toAccountWalletId(
    AccountWalletType.Keyring,
    KeyringTypes.simple,
  );
  const simpleKeyGroup0Id = toAccountGroupId(simpleKeyWalletId, '0');

  return {
    [srpWalletId]: {
      id: srpWalletId,
      type: AccountWalletType.Entropy,
      status: 'ready',
      metadata: {
        name: 'Main Wallet',
        entropy: { id: 'srp-1' },
      },
      groups: {
        [srpGroup0Id]: {
          id: srpGroup0Id,
          type: AccountGroupType.MultichainAccount,
          metadata: {
            name: 'Account 1',
            pinned: true,
            hidden: false,
            lastSelected: 0,
            entropy: { groupIndex: 0 },
          },
          accounts: ['0x1'],
        },
        [srpGroup1Id]: {
          id: srpGroup1Id,
          type: AccountGroupType.MultichainAccount,
          metadata: {
            name: 'Account 2',
            pinned: false,
            hidden: false,
            lastSelected: 0,
            entropy: { groupIndex: 1 },
          },
          accounts: ['0x2'],
        },
        [srpGroup2Id]: {
          id: srpGroup2Id,
          type: AccountGroupType.MultichainAccount,
          metadata: {
            name: 'Hidden Account',
            pinned: false,
            hidden: true,
            lastSelected: 0,
            entropy: { groupIndex: 2 },
          },
          accounts: ['0x3'],
        },
      },
    },
    [ledgerWalletId]: {
      id: ledgerWalletId,
      type: AccountWalletType.Keyring,
      status: 'ready',
      metadata: {
        name: 'Ledger Hardware',
        keyring: { type: KeyringTypes.ledger },
      },
      groups: {
        [ledgerGroup0Id]: {
          id: ledgerGroup0Id,
          type: AccountGroupType.SingleAccount,
          metadata: {
            name: 'Ledger 1',
            pinned: false,
            hidden: false,
            lastSelected: 0,
          },
          accounts: ['0x4'],
        },
      },
    },
    [simpleKeyWalletId]: {
      id: simpleKeyWalletId,
      type: AccountWalletType.Keyring,
      status: 'ready',
      metadata: {
        name: 'Simple Key Pair',
        keyring: { type: KeyringTypes.simple },
      },
      groups: {
        [simpleKeyGroup0Id]: {
          id: simpleKeyGroup0Id,
          type: AccountGroupType.SingleAccount,
          metadata: {
            name: 'Imported 1',
            pinned: false,
            hidden: false,
            lastSelected: 0,
          },
          accounts: ['0x5'],
        },
      },
    },
  };
};

const meta: Meta<typeof AccountManagementList> = {
  title: 'Components/MultichainAccounts/AccountManagementList',
  component: AccountManagementList,
  parameters: {
    docs: {
      description: {
        component:
          'Full Account Management list projecting wallets into pinned, entropy, hardware, and imported sections.',
      },
    },
  },
  argTypes: {
    isInSearchMode: { control: 'boolean' },
    onAccountClick: { action: 'accountClicked' },
    onRemoveWallet: { action: 'removeWallet' },
    onRemoveAccount: { action: 'removeAccount' },
  },
  args: {
    wallets: createMockWallets(),
    primaryEntropySourceId: 'srp-1',
    isInSearchMode: false,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '360px', margin: '0 auto' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AccountManagementList>;

export const Default: Story = {};

export const SearchMode: Story = {
  args: {
    isInSearchMode: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Search mode hides add-account rows within wallet sections.',
      },
    },
  },
};

export const EntropyWalletOnly: Story = {
  args: {
    wallets: (() => {
      const all = createMockWallets();
      const srpWalletId = toAccountWalletId(AccountWalletType.Entropy, 'srp-1');
      return {
        [srpWalletId]: all[srpWalletId],
      };
    })(),
  },
};
