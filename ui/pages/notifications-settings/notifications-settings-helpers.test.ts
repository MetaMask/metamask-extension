import type { InternalAccount } from '@metamask/keyring-internal-api';

import type { AccountGroupWithInternalAccounts } from '../../selectors/multichain-accounts/account-tree.types';
import {
  getNotificationWalletGroups,
  type NotificationWalletGroup,
} from './notifications-settings-helpers';

function createAccountGroup({
  id,
  walletId,
  walletName,
  accountName,
  accounts,
}: {
  id: string;
  walletId: string;
  walletName: string;
  accountName: string;
  accounts: InternalAccount[];
}): AccountGroupWithInternalAccounts {
  return {
    id,
    walletId,
    walletName,
    type: 'multichain-account',
    metadata: {
      name: accountName,
      pinned: false,
      hidden: false,
    },
    accounts,
  } as AccountGroupWithInternalAccounts;
}

function createAccount({
  id,
  address,
  type,
}: {
  id: string;
  address: string;
  type: string;
}): InternalAccount {
  return {
    id,
    address,
    type,
    options: {},
    methods: [],
    metadata: {
      name: id,
      keyring: {
        type: 'HD Key Tree',
      },
      importTime: 0,
    },
    scopes: [],
  } as InternalAccount;
}

describe('getNotificationWalletGroups', () => {
  it('groups notification accounts by wallet and filters unsupported accounts', () => {
    const accountGroups = [
      createAccountGroup({
        id: 'entropy:wallet-1/0',
        walletId: 'entropy:wallet-1',
        walletName: 'Wallet 1',
        accountName: 'Account 1',
        accounts: [
          createAccount({
            id: 'account-1-evm',
            address: '0x1111111111111111111111111111111111111111',
            type: 'eip155:eoa',
          }),
          createAccount({
            id: 'account-1-solana',
            address: 'SolanaAddress111111111111111111111111111111',
            type: 'solana:data-account',
          }),
        ],
      }),
      createAccountGroup({
        id: 'entropy:wallet-1/1',
        walletId: 'entropy:wallet-1',
        walletName: 'Wallet 1',
        accountName: 'Account 2',
        accounts: [
          createAccount({
            id: 'account-2-evm',
            address: '0x2222222222222222222222222222222222222222',
            type: 'eip155:eoa',
          }),
        ],
      }),
      createAccountGroup({
        id: 'keyring:wallet-2/0',
        walletId: 'keyring:wallet-2',
        walletName: 'Imported wallet',
        accountName: 'Imported 1',
        accounts: [
          createAccount({
            id: 'account-3-evm',
            address: '0x3333333333333333333333333333333333333333',
            type: 'eip155:eoa',
          }),
        ],
      }),
      createAccountGroup({
        id: 'keyring:wallet-2/1',
        walletId: 'keyring:wallet-2',
        walletName: 'Imported wallet',
        accountName: 'Imported 2',
        accounts: [
          createAccount({
            id: 'account-4-solana',
            address: 'SolanaAddress222222222222222222222222222222',
            type: 'solana:data-account',
          }),
        ],
      }),
    ];

    const result = getNotificationWalletGroups(accountGroups, [
      '0x1111111111111111111111111111111111111111',
      '0x2222222222222222222222222222222222222222',
      '0x3333333333333333333333333333333333333333',
    ]);

    expect(result).toStrictEqual<NotificationWalletGroup[]>([
      {
        walletId: 'entropy:wallet-1',
        walletName: 'Wallet 1',
        accounts: [
          {
            id: 'entropy:wallet-1/0',
            address: '0x1111111111111111111111111111111111111111',
            name: 'Account 1',
          },
          {
            id: 'entropy:wallet-1/1',
            address: '0x2222222222222222222222222222222222222222',
            name: 'Account 2',
          },
        ],
      },
      {
        walletId: 'keyring:wallet-2',
        walletName: 'Imported wallet',
        accounts: [
          {
            id: 'keyring:wallet-2/0',
            address: '0x3333333333333333333333333333333333333333',
            name: 'Imported 1',
          },
        ],
      },
    ]);
  });

  it('returns an empty list when there are no notification addresses', () => {
    expect(
      getNotificationWalletGroups(
        [
          createAccountGroup({
            id: 'entropy:wallet-1/0',
            walletId: 'entropy:wallet-1',
            walletName: 'Wallet 1',
            accountName: 'Account 1',
            accounts: [
              createAccount({
                id: 'account-1-evm',
                address: '0x1111111111111111111111111111111111111111',
                type: 'eip155:eoa',
              }),
            ],
          }),
        ],
        [],
      ),
    ).toStrictEqual([]);
  });
});
