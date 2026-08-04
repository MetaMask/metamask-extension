import type { ConsolidatedWallets } from '../../../selectors/multichain-accounts/account-tree.types';
import { getEvmAccountsGroupedByWallet } from './evm-accounts-grouped-by-wallet';

const ACCOUNT_1_ADDRESS = '0xabcdef1234567890abcdef1234567890abcdef12';
const ACCOUNT_2_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';
const NON_EVM_ADDRESS = 'bc1qexampleexampleexampleexampleexampleex';

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
});
