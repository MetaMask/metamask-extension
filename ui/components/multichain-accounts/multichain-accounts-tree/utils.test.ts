import { MergedInternalAccount } from '../../../selectors/selectors.types';
import { matchesSearchPattern } from './utils';

describe('matchesSearchPattern', () => {
  const mockAccount: MergedInternalAccount = {
    // @ts-expect-error - ignore the metadata type for this test
    metadata: {
      name: 'Test Account',
    },
    address: '0x123456789abcdef',
  };

  it('returns true when the pattern matches the account name (case-insensitive)', () => {
    expect(matchesSearchPattern('test', mockAccount)).toBe(true);
    expect(matchesSearchPattern('TEST', mockAccount)).toBe(true);
    expect(matchesSearchPattern('account', mockAccount)).toBe(true);
  });

  it('returns true when the pattern matches the account address (case-insensitive)', () => {
    expect(matchesSearchPattern('0x123', mockAccount)).toBe(true);
    expect(matchesSearchPattern('abcdef', mockAccount)).toBe(true);
    expect(matchesSearchPattern('0X123', mockAccount)).toBe(true);
  });

  it('returns false when the pattern does not match the account name or address', () => {
    expect(matchesSearchPattern('random', mockAccount)).toBe(false);
    expect(matchesSearchPattern('0x999', mockAccount)).toBe(false);
  });

  it('handles empty pattern gracefully', () => {
    expect(matchesSearchPattern('', mockAccount)).toBe(true); // Empty pattern matches everything
  });

  it('handles empty account metadata name gracefully', () => {
    const accountWithEmptyName: MergedInternalAccount = {
      // @ts-expect-error - ignore the metadata type for this test
      metadata: {
        name: '',
      },
      address: '0x123456789abcdef',
    };
    expect(matchesSearchPattern('test', accountWithEmptyName)).toBe(false);
    expect(matchesSearchPattern('0x123', accountWithEmptyName)).toBe(true);
  });

  it('handles empty account address gracefully', () => {
    const accountWithEmptyAddress: MergedInternalAccount = {
      // @ts-expect-error - ignore the metadata type for this test
      metadata: {
        name: 'Test Account',
      },
      address: '',
    };
    expect(matchesSearchPattern('test', accountWithEmptyAddress)).toBe(true);
    expect(matchesSearchPattern('0x123', accountWithEmptyAddress)).toBe(false);
  });
});
