import { renderHookWithProvider } from '../../../../../test/lib/render-helpers';
import mockState from '../../../../../test/data/mock-state.json';
import { type Recipient } from './useRecipients';
import { useSendRecipientFilter } from './useSendRecipientFilter';

describe('useSendRecipientFilter', () => {
  const mockContactRecipients: Recipient[] = [
    {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      contactName: 'John Doe',
    },
    {
      address: '0xabcdef1234567890abcdef1234567890abcdef12',
      contactName: 'Jane Smith',
    },
  ];

  const mockAccountRecipients: Recipient[] = [
    {
      address: '0x9876543210fedcba9876543210fedcba98765432',
      accountGroupName: 'My Accounts',
      walletName: 'Account 1',
    },
    {
      address: '0xfedcba9876543210fedcba9876543210fedcba98',
      accountGroupName: 'Hardware Wallet',
      walletName: 'Ledger Account 2',
    },
  ];

  it('returns all recipients when no search query provided', () => {
    const { result } = renderHookWithProvider(
      () =>
        useSendRecipientFilter({
          contactRecipients: mockContactRecipients,
          accountRecipients: mockAccountRecipients,
          searchQuery: '',
        }),
      mockState,
    );

    expect(result.current).toEqual({
      filteredContactRecipients: mockContactRecipients,
      filteredAccountRecipients: mockAccountRecipients,
    });
  });

  it('filters contact recipients by contact name', () => {
    const { result } = renderHookWithProvider(
      () =>
        useSendRecipientFilter({
          contactRecipients: mockContactRecipients,
          accountRecipients: mockAccountRecipients,
          searchQuery: 'john',
        }),
      mockState,
    );

    expect(result.current.filteredContactRecipients).toEqual([
      mockContactRecipients[0],
    ]);
    expect(result.current.filteredAccountRecipients).toEqual([]);
  });

  it('filters account recipients by account group name', () => {
    const { result } = renderHookWithProvider(
      () =>
        useSendRecipientFilter({
          contactRecipients: mockContactRecipients,
          accountRecipients: mockAccountRecipients,
          searchQuery: 'hardware',
        }),
      mockState,
    );

    expect(result.current.filteredContactRecipients).toEqual([]);
    expect(result.current.filteredAccountRecipients).toEqual([
      mockAccountRecipients[1],
    ]);
  });

  it('filters account recipients by wallet name', () => {
    const { result } = renderHookWithProvider(
      () =>
        useSendRecipientFilter({
          contactRecipients: mockContactRecipients,
          accountRecipients: mockAccountRecipients,
          searchQuery: 'ledger',
        }),
      mockState,
    );

    expect(result.current.filteredContactRecipients).toEqual([]);
    expect(result.current.filteredAccountRecipients).toEqual([
      mockAccountRecipients[1],
    ]);
  });

  it('filters recipients by address', () => {
    const { result } = renderHookWithProvider(
      () =>
        useSendRecipientFilter({
          contactRecipients: mockContactRecipients,
          accountRecipients: mockAccountRecipients,
          searchQuery: '0x1234',
        }),
      mockState,
    );

    expect(result.current.filteredContactRecipients).toEqual([
      mockContactRecipients[0],
    ]);
    expect(result.current.filteredAccountRecipients).toEqual([]);
  });

  it('performs case insensitive search', () => {
    const { result } = renderHookWithProvider(
      () =>
        useSendRecipientFilter({
          contactRecipients: mockContactRecipients,
          accountRecipients: mockAccountRecipients,
          searchQuery: 'JANE SMITH',
        }),
      mockState,
    );

    expect(result.current.filteredContactRecipients).toEqual([
      mockContactRecipients[1],
    ]);
    expect(result.current.filteredAccountRecipients).toEqual([]);
  });

  it('returns empty arrays when no matches found', () => {
    const { result } = renderHookWithProvider(
      () =>
        useSendRecipientFilter({
          contactRecipients: mockContactRecipients,
          accountRecipients: mockAccountRecipients,
          searchQuery: 'nonexistent',
        }),
      mockState,
    );

    expect(result.current.filteredContactRecipients).toEqual([]);
    expect(result.current.filteredAccountRecipients).toEqual([]);
  });

  it('handles empty recipient arrays', () => {
    const { result } = renderHookWithProvider(
      () =>
        useSendRecipientFilter({
          contactRecipients: [],
          accountRecipients: [],
          searchQuery: 'search',
        }),
      mockState,
    );

    expect(result.current.filteredContactRecipients).toEqual([]);
    expect(result.current.filteredAccountRecipients).toEqual([]);
  });

  it('ignores whitespace in search query', () => {
    const { result } = renderHookWithProvider(
      () =>
        useSendRecipientFilter({
          contactRecipients: mockContactRecipients,
          accountRecipients: mockAccountRecipients,
          searchQuery: '  john  ',
        }),
      mockState,
    );

    expect(result.current.filteredContactRecipients).toEqual([
      mockContactRecipients[0],
    ]);
    expect(result.current.filteredAccountRecipients).toEqual([]);
  });

  it('returns all recipients when search query is only whitespace', () => {
    const { result } = renderHookWithProvider(
      () =>
        useSendRecipientFilter({
          contactRecipients: mockContactRecipients,
          accountRecipients: mockAccountRecipients,
          searchQuery: '   ',
        }),
      mockState,
    );

    expect(result.current.filteredContactRecipients).toEqual(
      mockContactRecipients,
    );
    expect(result.current.filteredAccountRecipients).toEqual(
      mockAccountRecipients,
    );
  });
});
