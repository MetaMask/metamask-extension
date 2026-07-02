import { ETH_TOKEN_IMAGE_URL } from '../../../../../shared/constants/network';
import type { RawHardwareAccount } from '../types';
import {
  mapAccountIdsToIndices,
  mapHardwareAccountsToWalletAccounts,
  mapIndicesToAccountIds,
} from './map-hardware-accounts';

const SAMPLE_ADDRESS = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12';

const createRawAccount = (
  overrides: Partial<RawHardwareAccount> = {},
): RawHardwareAccount => ({
  address: SAMPLE_ADDRESS,
  index: 0,
  ...overrides,
});

describe('mapHardwareAccountsToWalletAccounts', () => {
  it('returns an empty array when no accounts are provided', () => {
    expect(mapHardwareAccountsToWalletAccounts([], [], 'Ethereum')).toStrictEqual(
      [],
    );
  });

  it('maps a single account to a wallet card with Ethereum-only addresses', () => {
    const result = mapHardwareAccountsToWalletAccounts(
      [createRawAccount({ index: 2 })],
      [],
      'Ethereum',
    );

    expect(result).toStrictEqual([
      {
        id: 'account-2',
        name: 'Account 3',
        addresses: [
          {
            id: 'eth-2',
            networkName: 'Ethereum',
            address: SAMPLE_ADDRESS,
            iconUrl: ETH_TOKEN_IMAGE_URL,
          },
        ],
        isAlreadyConnected: false,
      },
    ]);
  });

  it('omits balance fields when mapping accounts for onboarding', () => {
    const result = mapHardwareAccountsToWalletAccounts(
      [createRawAccount()],
      [],
      'Ethereum',
    );

    expect(result[0]).not.toHaveProperty('totalBalance');
    expect(result[0].addresses[0]).not.toHaveProperty('balance');
  });

  it('maps multiple accounts in order', () => {
    const accounts: RawHardwareAccount[] = [
      createRawAccount({ address: '0x1111', index: 0 }),
      createRawAccount({ address: '0x2222', index: 1 }),
    ];

    const result = mapHardwareAccountsToWalletAccounts(
      accounts,
      [],
      'Ethereum Mainnet',
    );

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('account-0');
    expect(result[1].id).toBe('account-1');
    expect(result[0].addresses[0].networkName).toBe('Ethereum Mainnet');
    expect(result[1].addresses[0].address).toBe('0x2222');
  });

  it('marks an account as already connected when the address matches case-insensitively', () => {
    const result = mapHardwareAccountsToWalletAccounts(
      [createRawAccount()],
      ['0xabcdef1234567890abcdef1234567890abcdef12'],
      'Ethereum',
    );

    expect(result[0].isAlreadyConnected).toBe(true);
  });

  it('does not mark an account as connected when the address is absent from connectedAccounts', () => {
    const result = mapHardwareAccountsToWalletAccounts(
      [createRawAccount()],
      ['0x0000000000000000000000000000000000000001'],
      'Ethereum',
    );

    expect(result[0].isAlreadyConnected).toBe(false);
  });
});

describe('mapAccountIdsToIndices', () => {
  it('returns an empty array when no account ids are provided', () => {
    expect(mapAccountIdsToIndices([])).toStrictEqual([]);
  });

  it('converts account ids to numeric indices', () => {
    expect(mapAccountIdsToIndices(['account-0', 'account-4'])).toStrictEqual([
      0, 4,
    ]);
  });

  it('ignores invalid account card ids', () => {
    expect(
      mapAccountIdsToIndices(['account-0', 'invalid', 'account-']),
    ).toStrictEqual([0]);
  });
});

describe('mapIndicesToAccountIds', () => {
  it('returns an empty array when no indices are provided', () => {
    expect(mapIndicesToAccountIds([])).toStrictEqual([]);
  });

  it('converts numeric indices to account ids', () => {
    expect(mapIndicesToAccountIds([0, 4])).toStrictEqual([
      'account-0',
      'account-4',
    ]);
  });
});

describe('account id mapping round trip', () => {
  it('preserves indices when converting ids to indices and back', () => {
    const indices = [0, 2, 7];
    const accountIds = mapIndicesToAccountIds(indices);

    expect(mapAccountIdsToIndices(accountIds)).toStrictEqual(indices);
  });
});
