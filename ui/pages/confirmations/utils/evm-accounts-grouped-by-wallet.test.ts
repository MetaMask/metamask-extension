import { KeyringTypes } from '@metamask/keyring-controller';
import type { ConsolidatedWallets } from '../../../selectors/multichain-accounts/account-tree.types';
import { getEvmAccountsGroupedByWallet } from './evm-accounts-grouped-by-wallet';

const ACCOUNT_1_ADDRESS = '0xabcdef1234567890abcdef1234567890abcdef12';
const ACCOUNT_2_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';
const LEDGER_ADDRESS = '0xfedcba0987654321fedcba0987654321fedcba09';
const TREZOR_ADDRESS = '0x9876543210fedcba9876543210fedcba98765432';
const NON_EVM_ADDRESS = 'bc1qexampleexampleexampleexampleexampleex';

const hardwareAccount = (address: string, keyringType: KeyringTypes) => ({
  address,
  type: 'eip155:eoa',
  metadata: { keyring: { type: keyringType } },
});

const HARDWARE_WALLETS_MOCK = {
  'wallet-1': {
    id: 'wallet-1',
    metadata: { name: 'Wallet 1' },
    groups: {
      'group-1': {
        id: 'group-1',
        metadata: { name: 'Account 1' },
        accounts: [{ address: ACCOUNT_1_ADDRESS, type: 'eip155:eoa' }],
      },
      'group-2': {
        id: 'group-2',
        metadata: { name: 'Ledger Account' },
        accounts: [hardwareAccount(LEDGER_ADDRESS, KeyringTypes.ledger)],
      },
    },
  },
  'wallet-2': {
    id: 'wallet-2',
    metadata: { name: 'Trezor Wallet' },
    groups: {
      'group-3': {
        id: 'group-3',
        metadata: { name: 'Trezor Account' },
        accounts: [hardwareAccount(TREZOR_ADDRESS, KeyringTypes.trezor)],
      },
    },
  },
} as unknown as ConsolidatedWallets;

const WALLETS_MOCK = {
  'wallet-1': {
    id: 'wallet-1',
    metadata: { name: 'Wallet 1' },
    groups: {
      'group-1': {
        id: 'group-1',
        metadata: { name: 'Account 1' },
        accounts: [{ address: ACCOUNT_1_ADDRESS, type: 'eip155:eoa' }],
      },
      'group-2': {
        id: 'group-2',
        metadata: { name: 'Account 2' },
        accounts: [{ address: ACCOUNT_2_ADDRESS, type: 'eip155:eoa' }],
      },
      'group-3': {
        id: 'group-3',
        metadata: { name: 'Bitcoin Account' },
        accounts: [{ address: NON_EVM_ADDRESS, type: 'bip122:p2wpkh' }],
      },
    },
  },
  'wallet-2': {
    id: 'wallet-2',
    metadata: { name: 'Non-EVM Wallet' },
    groups: {
      'group-4': {
        id: 'group-4',
        metadata: { name: 'Only Bitcoin' },
        accounts: [{ address: NON_EVM_ADDRESS, type: 'bip122:p2wpkh' }],
      },
    },
  },
} as unknown as ConsolidatedWallets;

describe('getEvmAccountsGroupedByWallet', () => {
  it('returns EVM accounts grouped by wallet', () => {
    expect(getEvmAccountsGroupedByWallet(WALLETS_MOCK)).toStrictEqual([
      {
        id: 'wallet-1',
        name: 'Wallet 1',
        accounts: [
          {
            id: 'group-1',
            name: 'Account 1',
            address: ACCOUNT_1_ADDRESS,
            type: 'eip155:eoa',
          },
          {
            id: 'group-2',
            name: 'Account 2',
            address: ACCOUNT_2_ADDRESS,
            type: 'eip155:eoa',
          },
        ],
      },
    ]);
  });

  it('excludes wallets that have no EVM accounts', () => {
    const result = getEvmAccountsGroupedByWallet(WALLETS_MOCK);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Wallet 1');
  });

  it('returns an empty array when there are no wallets', () => {
    expect(
      getEvmAccountsGroupedByWallet({} as ConsolidatedWallets),
    ).toStrictEqual([]);
  });

  describe('excludeHardwareAccounts', () => {
    it('includes hardware accounts by default', () => {
      const result = getEvmAccountsGroupedByWallet(HARDWARE_WALLETS_MOCK);

      expect(result).toStrictEqual([
        {
          id: 'wallet-1',
          name: 'Wallet 1',
          accounts: [
            {
              id: 'group-1',
              name: 'Account 1',
              address: ACCOUNT_1_ADDRESS,
              type: 'eip155:eoa',
            },
            {
              id: 'group-2',
              name: 'Ledger Account',
              address: LEDGER_ADDRESS,
              type: 'eip155:eoa',
            },
          ],
        },
        {
          id: 'wallet-2',
          name: 'Trezor Wallet',
          accounts: [
            {
              id: 'group-3',
              name: 'Trezor Account',
              address: TREZOR_ADDRESS,
              type: 'eip155:eoa',
            },
          ],
        },
      ]);
    });

    it('excludes hardware accounts when enabled', () => {
      const result = getEvmAccountsGroupedByWallet(HARDWARE_WALLETS_MOCK, {
        excludeHardwareAccounts: true,
      });

      expect(result).toStrictEqual([
        {
          id: 'wallet-1',
          name: 'Wallet 1',
          accounts: [
            {
              id: 'group-1',
              name: 'Account 1',
              address: ACCOUNT_1_ADDRESS,
              type: 'eip155:eoa',
            },
          ],
        },
      ]);
    });

    it('excludes wallets whose only accounts are hardware accounts', () => {
      const result = getEvmAccountsGroupedByWallet(HARDWARE_WALLETS_MOCK, {
        excludeHardwareAccounts: true,
      });

      expect(result.map((wallet) => wallet.name)).toStrictEqual(['Wallet 1']);
    });

    const hardwareKeyringTypes = [
      KeyringTypes.ledger,
      KeyringTypes.trezor,
      KeyringTypes.oneKey,
      KeyringTypes.lattice,
      KeyringTypes.qr,
    ];

    for (const keyringType of hardwareKeyringTypes) {
      it(`excludes ${keyringType} accounts`, () => {
        const wallets = {
          'wallet-1': {
            id: 'wallet-1',
            metadata: { name: 'Wallet 1' },
            groups: {
              'group-1': {
                id: 'group-1',
                metadata: { name: 'Hardware Account' },
                accounts: [hardwareAccount(LEDGER_ADDRESS, keyringType)],
              },
            },
          },
        } as unknown as ConsolidatedWallets;

        expect(
          getEvmAccountsGroupedByWallet(wallets, {
            excludeHardwareAccounts: true,
          }),
        ).toStrictEqual([]);
      });
    }

    it('keeps non-hardware accounts such as HD and imported', () => {
      const wallets = {
        'wallet-1': {
          id: 'wallet-1',
          metadata: { name: 'Wallet 1' },
          groups: {
            'group-1': {
              id: 'group-1',
              metadata: { name: 'HD Account' },
              accounts: [hardwareAccount(ACCOUNT_1_ADDRESS, KeyringTypes.hd)],
            },
            'group-2': {
              id: 'group-2',
              metadata: { name: 'Imported Account' },
              accounts: [
                hardwareAccount(ACCOUNT_2_ADDRESS, KeyringTypes.simple),
              ],
            },
          },
        },
      } as unknown as ConsolidatedWallets;

      const result = getEvmAccountsGroupedByWallet(wallets, {
        excludeHardwareAccounts: true,
      });

      expect(result[0].accounts.map((account) => account.name)).toStrictEqual([
        'HD Account',
        'Imported Account',
      ]);
    });
  });
});
