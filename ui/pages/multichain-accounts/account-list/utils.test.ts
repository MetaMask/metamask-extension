import mockState from '../../../../test/data/mock-state.json';
import { AccountTreeWallets } from '../../../selectors/multichain-accounts/account-tree.types';
import { filterWalletsByGroupName } from './utils';

describe('filterWalletsByGroupName', () => {
  const mockWallets: AccountTreeWallets = mockState.metamask.accountTree
    .wallets as unknown as AccountTreeWallets;

  it('returns original wallets when search pattern is empty', () => {
    const result = filterWalletsByGroupName(mockWallets, '');
    expect(result).toBe(mockWallets);

    const resultWithSpaces = filterWalletsByGroupName(mockWallets, '   ');
    expect(resultWithSpaces).toBe(mockWallets);
  });

  it('filters wallets to only include groups with matching names', () => {
    const result = filterWalletsByGroupName(mockWallets, 'Account 2');

    expect(Object.keys(result)).toHaveLength(1);
    expect(result['entropy:01JKAF3PJ247KAM6C03G5Q0NP8']).toBeDefined();

    const wallet = result['entropy:01JKAF3PJ247KAM6C03G5Q0NP8'];
    expect(Object.keys(wallet.groups)).toHaveLength(1);
    expect(wallet.groups['entropy:01JKAF3PJ247KAM6C03G5Q0NP8/0']).toBeDefined();
  });

  it('filters wallets to only include groups with partially matching names', () => {
    const result = filterWalletsByGroupName(mockWallets, 'Account');

    expect(Object.keys(result)).toHaveLength(5);
  });

  it('handles case-insensitive search', () => {
    const result1 = filterWalletsByGroupName(mockWallets, 'ACCOUNT 2');
    const result2 = filterWalletsByGroupName(mockWallets, 'account 2');

    expect(Object.keys(result1)).toEqual(Object.keys(result2));
    expect(result1).toEqual(result2);
    expect(Object.keys(result1)).toHaveLength(1);
  });

  it('trims search pattern before matching', () => {
    const result = filterWalletsByGroupName(mockWallets, '  Account 2  ');

    expect(Object.keys(result)).toHaveLength(1);
    expect(result['entropy:01JKAF3PJ247KAM6C03G5Q0NP8']).toBeDefined();
  });

  it('returns empty object when no matches are found', () => {
    const result = filterWalletsByGroupName(mockWallets, 'nonexistent');

    expect(Object.keys(result)).toHaveLength(0);
  });

  it('preserves wallet properties in filtered results', () => {
    const result = filterWalletsByGroupName(mockWallets, 'Account 1');
    const originalWallet = mockWallets['entropy:01JKAF3DSGM3AB87EM9N0K41AJ'];
    const filteredWallet = result['entropy:01JKAF3DSGM3AB87EM9N0K41AJ'];

    expect(filteredWallet.id).toBe(originalWallet.id);
    expect(filteredWallet.type).toBe(originalWallet.type);
    expect(filteredWallet.metadata).toEqual(originalWallet.metadata);
  });
});
