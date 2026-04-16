import { AccountGroupId } from '@metamask/account-api';
import mockState from '../../../../test/data/mock-state.json';
import {
  AccountTreeWallets,
  NormalizedGroupMetadata,
} from '../../../selectors/multichain-accounts/account-tree.types';
import { filterWalletsByGroupNameOrAddress } from './utils';

describe('filterWalletsByGroupNameOrAddress', () => {
  const mockWallets: AccountTreeWallets = mockState.metamask.accountTree
    .wallets as unknown as AccountTreeWallets;
  const mockGroupsMetadata: Record<AccountGroupId, NormalizedGroupMetadata> = {
    'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0': {
      name: 'account 1',
      accounts: [
        '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b',
      ],
    },
    'entropy:01JKAF3PJ247KAM6C03G5Q0NP8/0': {
      name: 'account 2',
      accounts: ['0xeb9e64b93097bc15f01f13eae97015c57ab64823'],
    },
    'keyring:Ledger Hardware/0xc42edfcc21ed14dda456aa0756c153f7985d8813': {
      name: 'ledger account 1',
      accounts: ['0xc42edfcc21ed14dda456aa0756c153f7985d8813'],
    },
    'snap:local:custody:test/0xca8f1F0245530118D0cf14a06b01Daf8f76Cf281': {
      name: 'another snap account 1',
      accounts: ['0xca8f1f0245530118d0cf14a06b01daf8f76cf281'],
    },
    'snap:local:snap-id/0xb552685e3d2790efd64a175b00d51f02cdafee5d': {
      name: 'snap account 1',
      accounts: ['0xb552685e3d2790efd64a175b00d51f02cdafee5d'],
    },
  };

  it('returns original wallets when search pattern is empty', () => {
    const result = filterWalletsByGroupNameOrAddress(
      mockWallets,
      '',
      mockGroupsMetadata,
    );
    expect(result).toBe(mockWallets);

    const resultWithSpaces = filterWalletsByGroupNameOrAddress(
      mockWallets,
      '   ',
      mockGroupsMetadata,
    );
    expect(resultWithSpaces).toBe(mockWallets);
  });

  it('filters wallets to only include groups with matching names', () => {
    const result = filterWalletsByGroupNameOrAddress(
      mockWallets,
      'Account 2',
      mockGroupsMetadata,
    );

    expect(Object.keys(result)).toHaveLength(1);
    expect(result['entropy:01JKAF3PJ247KAM6C03G5Q0NP8']).toBeDefined();

    const wallet = result['entropy:01JKAF3PJ247KAM6C03G5Q0NP8'];
    expect(Object.keys(wallet.groups)).toHaveLength(1);
    expect(wallet.groups['entropy:01JKAF3PJ247KAM6C03G5Q0NP8/0']).toBeDefined();
  });

  it('filters wallets to only include groups with matching addresses', () => {
    const result = filterWalletsByGroupNameOrAddress(
      mockWallets,
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      mockGroupsMetadata,
    );
    expect(Object.keys(result)).toHaveLength(1);
    expect(result['entropy:01JKAF3DSGM3AB87EM9N0K41AJ']).toBeDefined();
  });

  it('filters wallets to only include groups with partially matching names', () => {
    const result = filterWalletsByGroupNameOrAddress(
      mockWallets,
      'Account',
      mockGroupsMetadata,
    );

    expect(Object.keys(result)).toHaveLength(5);
  });

  it('handles case-insensitive search', () => {
    const result1 = filterWalletsByGroupNameOrAddress(
      mockWallets,
      'ACCOUNT 2',
      mockGroupsMetadata,
    );
    const result2 = filterWalletsByGroupNameOrAddress(
      mockWallets,
      'account 2',
      mockGroupsMetadata,
    );

    expect(Object.keys(result1)).toEqual(Object.keys(result2));
    expect(result1).toEqual(result2);
    expect(Object.keys(result1)).toHaveLength(1);
  });

  it('trims search pattern before matching', () => {
    const result = filterWalletsByGroupNameOrAddress(
      mockWallets,
      '  Account 2  ',
      mockGroupsMetadata,
    );

    expect(Object.keys(result)).toHaveLength(1);
    expect(result['entropy:01JKAF3PJ247KAM6C03G5Q0NP8']).toBeDefined();
  });

  it('returns empty object when no matches are found', () => {
    const result = filterWalletsByGroupNameOrAddress(
      mockWallets,
      'nonexistent',
      mockGroupsMetadata,
    );

    expect(Object.keys(result)).toHaveLength(0);
  });

  it('preserves wallet properties in filtered results', () => {
    const result = filterWalletsByGroupNameOrAddress(
      mockWallets,
      'Account 1',
      mockGroupsMetadata,
    );
    const originalWallet = mockWallets['entropy:01JKAF3DSGM3AB87EM9N0K41AJ'];
    const filteredWallet = result['entropy:01JKAF3DSGM3AB87EM9N0K41AJ'];

    expect(filteredWallet.id).toBe(originalWallet.id);
    expect(filteredWallet.type).toBe(originalWallet.type);
    expect(filteredWallet.metadata).toEqual(originalWallet.metadata);
  });
});
