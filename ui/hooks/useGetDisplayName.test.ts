import { renderHook } from '@testing-library/react';
import { NameEntry } from '@metamask/name-controller';
import { useGetDisplayName } from './useGetDisplayName';

type MockState = {
  addressBook: { address: string; name?: string }[];
  accountGroups: {
    metadata?: { name?: string };
    accounts: { address: string }[];
  }[];
  tokenList: Record<string, { name?: string }>;
  names: Record<string, Record<string, Record<string, NameEntry>>>;
};

// Declared before jest.mock factories so eslint no-use-before-define is happy.
// Reassigned per test: selectors memoize on the state reference.
let mockState: MockState;

jest.mock('react-redux', () => ({
  useSelector: jest.fn((selector: (state: unknown) => unknown) =>
    selector(mockState),
  ),
}));

jest.mock('../selectors', () => ({
  getCompleteAddressBook: jest.fn(
    (state: { addressBook: unknown }) => state.addressBook,
  ),
  getTokenList: jest.fn((state: { tokenList: unknown }) => state.tokenList),
  getNames: jest.fn((state: { names: unknown }) => state.names),
}));

jest.mock('../selectors/multichain-accounts/account-tree', () => ({
  getAccountGroupWithInternalAccounts: jest.fn(
    (state: { accountGroups: unknown }) => state.accountGroups,
  ),
}));

const mockAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
const mockSolanaAddress = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

function setState(overrides: Partial<MockState> = {}) {
  mockState = {
    addressBook: [],
    accountGroups: [],
    tokenList: {},
    names: {},
    ...overrides,
  };
}

describe('useGetDisplayName', () => {
  beforeEach(() => setState());

  it('returns the contact name when present', () => {
    setState({ addressBook: [{ address: mockAddress, name: 'Alice' }] });

    const { result } = renderHook(() => useGetDisplayName());

    expect(result.current(mockAddress)).toBe('Alice');
  });

  it('prioritizes account name over contact name', () => {
    setState({
      accountGroups: [
        {
          metadata: { name: 'My Account' },
          accounts: [{ address: mockAddress }],
        },
      ],
      addressBook: [{ address: mockAddress, name: 'Alice' }],
    });

    const { result } = renderHook(() => useGetDisplayName());

    expect(result.current(mockAddress)).toBe('My Account');
  });

  it('matches regardless of address casing', () => {
    setState({
      addressBook: [{ address: mockAddress.toLowerCase(), name: 'Alice' }],
    });

    const { result } = renderHook(() => useGetDisplayName());

    expect(result.current(mockAddress.toUpperCase())).toBe('Alice');
  });

  it('falls back to the token name for a contract address', () => {
    setState({
      tokenList: { [mockAddress.toLowerCase()]: { name: 'Wrapped Ether' } },
    });

    const { result } = renderHook(() => useGetDisplayName());

    expect(result.current(mockAddress)).toBe('Wrapped Ether');
  });

  it('falls back to names from NameController', () => {
    setState({
      names: {
        ethereumAddress: {
          [mockAddress.toLowerCase()]: {
            '*': {
              name: 'пример.eth',
              sourceId: null,
              origin: null,
              proposedNames: {},
            },
          },
        },
      },
    });

    const { result } = renderHook(() => useGetDisplayName());

    expect(result.current(mockAddress)).toBe('пример.eth');
  });

  it('returns the contact name for a non-EVM address', () => {
    setState({
      addressBook: [{ address: mockSolanaAddress, name: 'Solana Me' }],
    });

    const { result } = renderHook(() => useGetDisplayName());

    expect(result.current(mockSolanaAddress)).toBe('Solana Me');
  });

  it('falls back to a shortened address', () => {
    const { result } = renderHook(() => useGetDisplayName());

    expect(result.current(mockAddress)).toBe('0xd8dA6...96045');
  });

  it('returns an empty string for a missing address', () => {
    const { result } = renderHook(() => useGetDisplayName());

    expect(result.current(undefined)).toBe('');
    expect(result.current('')).toBe('');
  });

  it('shortens a non-EVM address without adding a hex prefix', () => {
    const { result } = renderHook(() => useGetDisplayName());

    expect(result.current(mockSolanaAddress)).toBe('EPjFWdd...TDt1v');
  });
});
