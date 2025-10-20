import { renderHookWithProvider } from '../../../../../test/lib/render-helpers';
import mockState from '../../../../../test/data/mock-state.json';
import * as accountTreeSelectors from '../../../../selectors/multichain-accounts/account-tree';
import { AccountGroupWithInternalAccounts } from '../../../../selectors/multichain-accounts/account-tree.types';
import { useAccountAddressSeedIconMap } from './useAccountAddressSeedIconMap';

jest.mock('../../../../selectors/multichain-accounts/account-tree');

describe('useAccountAddressSeedIconMap', () => {
  const mockGetAccountGroupWithInternalAccounts = jest.spyOn(
    accountTreeSelectors,
    'getAccountGroupWithInternalAccounts',
  );

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAccountGroupWithInternalAccounts.mockReturnValue([]);
  });

  it('creates seed address map from account groups with single account per group', () => {
    const mockAccountGroups = [
      {
        accounts: [{ address: '0x1234567890abcdef1234567890abcdef12345678' }],
      },
      {
        accounts: [{ address: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12' }],
      },
    ];

    mockGetAccountGroupWithInternalAccounts.mockReturnValue(
      mockAccountGroups as AccountGroupWithInternalAccounts[],
    );

    const { result } = renderHookWithProvider(
      () => useAccountAddressSeedIconMap(),
      mockState,
    );

    expect(result.current.accountAddressSeedIconMap.size).toBe(2);
    expect(
      result.current.accountAddressSeedIconMap.get(
        '0x1234567890abcdef1234567890abcdef12345678',
      ),
    ).toBe('0x1234567890abcdef1234567890abcdef12345678');
    expect(
      result.current.accountAddressSeedIconMap.get(
        '0xabcdef1234567890abcdef1234567890abcdef12',
      ),
    ).toBe('0xABCDEF1234567890ABCDEF1234567890ABCDEF12');
  });

  it('creates seed address map from account groups with multiple accounts per group', () => {
    const mockAccountGroups = [
      {
        accounts: [
          { address: '0x1111111111111111111111111111111111111111' },
          { address: '0x2222222222222222222222222222222222222222' },
          { address: '0x3333333333333333333333333333333333333333' },
        ],
      },
      {
        accounts: [
          { address: '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' },
          { address: '0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB' },
        ],
      },
    ];

    mockGetAccountGroupWithInternalAccounts.mockReturnValue(
      mockAccountGroups as AccountGroupWithInternalAccounts[],
    );

    const { result } = renderHookWithProvider(
      () => useAccountAddressSeedIconMap(),
      mockState,
    );

    expect(result.current.accountAddressSeedIconMap.size).toBe(5);
    expect(
      result.current.accountAddressSeedIconMap.get(
        '0x1111111111111111111111111111111111111111',
      ),
    ).toBe('0x1111111111111111111111111111111111111111');
    expect(
      result.current.accountAddressSeedIconMap.get(
        '0x2222222222222222222222222222222222222222',
      ),
    ).toBe('0x1111111111111111111111111111111111111111');
    expect(
      result.current.accountAddressSeedIconMap.get(
        '0x3333333333333333333333333333333333333333',
      ),
    ).toBe('0x1111111111111111111111111111111111111111');
    expect(
      result.current.accountAddressSeedIconMap.get(
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      ),
    ).toBe('0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
    expect(
      result.current.accountAddressSeedIconMap.get(
        '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      ),
    ).toBe('0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
  });

  it('returns empty map when no account groups exist', () => {
    const { result } = renderHookWithProvider(
      () => useAccountAddressSeedIconMap(),
      mockState,
    );

    expect(result.current.accountAddressSeedIconMap.size).toBe(0);
  });

  it('handles account groups with empty accounts array', () => {
    const mockAccountGroups = [
      {
        accounts: [],
      },
      {
        accounts: [{ address: '0x1111111111111111111111111111111111111111' }],
      },
    ];

    mockGetAccountGroupWithInternalAccounts.mockReturnValue(
      mockAccountGroups as AccountGroupWithInternalAccounts[],
    );

    const { result } = renderHookWithProvider(
      () => useAccountAddressSeedIconMap(),
      mockState,
    );

    expect(result.current.accountAddressSeedIconMap.size).toBe(1);
    expect(
      result.current.accountAddressSeedIconMap.get(
        '0x1111111111111111111111111111111111111111',
      ),
    ).toBe('0x1111111111111111111111111111111111111111');
  });

  it('handles mixed case addresses by converting keys to lowercase', () => {
    const mockAccountGroups = [
      {
        accounts: [
          { address: '0xAbCdEf1234567890AbCdEf1234567890AbCdEf12' },
          { address: '0X1234567890ABCDEF1234567890ABCDEF12345678' },
        ],
      },
    ];

    mockGetAccountGroupWithInternalAccounts.mockReturnValue(
      mockAccountGroups as AccountGroupWithInternalAccounts[],
    );

    const { result } = renderHookWithProvider(
      () => useAccountAddressSeedIconMap(),
      mockState,
    );

    expect(result.current.accountAddressSeedIconMap.size).toBe(2);
    expect(
      result.current.accountAddressSeedIconMap.get(
        '0xabcdef1234567890abcdef1234567890abcdef12',
      ),
    ).toBe('0xAbCdEf1234567890AbCdEf1234567890AbCdEf12');
    expect(
      result.current.accountAddressSeedIconMap.get(
        '0x1234567890abcdef1234567890abcdef12345678',
      ),
    ).toBe('0xAbCdEf1234567890AbCdEf1234567890AbCdEf12');
  });
});
