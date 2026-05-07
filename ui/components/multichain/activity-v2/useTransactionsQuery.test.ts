import React from 'react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import {
  act,
  renderHook as renderHookBase,
} from '@testing-library/react-hooks';
import {
  usePrefetchTransactions,
  useTransactionsQuery,
} from './useTransactionsQuery';

const mockUseInfiniteQuery = jest.fn();
const mockUseQueryClient = jest.fn();
const mockGetV4MultiAccountTransactionsInfiniteQueryOptions = jest.fn();

jest.mock('@tanstack/react-query', () => ({
  useInfiniteQuery: (...args: unknown[]) => mockUseInfiniteQuery(...args),
  useQueryClient: () => mockUseQueryClient(),
}));

jest.mock('../../../helpers/api-client', () => ({
  apiClient: {
    accounts: {
      getV4MultiAccountTransactionsInfiniteQueryOptions: (...args: unknown[]) =>
        mockGetV4MultiAccountTransactionsInfiniteQueryOptions(...args),
    },
  },
}));

const selectedAddress = '0x4f5243ceea96cee1da0fdb89c756d0e999439424';
const expectedEvmAddress = selectedAddress;
const expectedNetworks = ['eip155:1'];
const mockStore = configureMockStore()({
  localeMessages: {
    currentLocale: 'en_GB',
  },
  metamask: {
    useExternalServices: true,
    enabledNetworkMap: {
      eip155: {
        '0x1': true,
      },
    },
    transactions: [],
    internalAccounts: {
      selectedAccount: '1',
      accounts: {
        '1': {
          address: selectedAddress,
          type: 'eip155:eoa',
        },
      },
    },
  },
});

function renderQueryHook<Result>(callback: () => Result) {
  return renderHookBase(callback, {
    wrapper: ({ children }) =>
      React.createElement(Provider, { store: mockStore }, children),
  });
}

beforeEach(() => {
  mockUseInfiniteQuery.mockReturnValue({ data: undefined });
  mockGetV4MultiAccountTransactionsInfiniteQueryOptions.mockReturnValue({
    queryKey: ['transactions'],
    queryFn: jest.fn(),
    getNextPageParam: jest.fn(),
    enabled: true,
  });
  mockUseQueryClient.mockReturnValue({
    getQueryData: jest.fn().mockReturnValue(undefined),
    isFetching: jest.fn().mockReturnValue(0),
    prefetchInfiniteQuery: jest.fn().mockResolvedValue(undefined),
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('useTransactionsQuery', () => {
  it('composes query options and delegates to useInfiniteQuery', () => {
    renderQueryHook(() => useTransactionsQuery());

    expect(
      mockGetV4MultiAccountTransactionsInfiniteQueryOptions,
    ).toHaveBeenCalledWith({
      accountAddresses: [`eip155:0:${expectedEvmAddress}`],
      networks: expectedNetworks,
      includeTxMetadata: true,
      lang: 'en',
    });
    expect(mockUseInfiniteQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.any(Function),
        enabled: true,
        staleTime: 300000,
      }),
    );
  });

  it('uses a single EVM network when filtering by chain ID', () => {
    renderQueryHook(() =>
      useTransactionsQuery({
        chainId: 'eip155:137',
        assetScope: {
          kind: 'token',
          tokenAddress: '0x0000000000000000000000000000000000000000',
        },
      }),
    );

    expect(
      mockGetV4MultiAccountTransactionsInfiniteQueryOptions,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        networks: ['eip155:137'],
      }),
    );
  });

  it('disables the query for non-EVM chain filters', () => {
    renderQueryHook(() =>
      useTransactionsQuery({
        chainId: 'solana:101',
        assetScope: { kind: 'native' },
      }),
    );

    expect(
      mockGetV4MultiAccountTransactionsInfiniteQueryOptions,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        networks: [],
      }),
    );
    expect(mockUseInfiniteQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      }),
    );
  });
});

describe('usePrefetchTransactions', () => {
  it('prefetches when query is not cached and not fetching', () => {
    const mockQueryClient = {
      getQueryData: jest.fn().mockReturnValue(undefined),
      isFetching: jest.fn().mockReturnValue(0),
      prefetchInfiniteQuery: jest.fn().mockResolvedValue(undefined),
    };
    const queryOptions = {
      queryKey: ['transactions'],
      queryFn: jest.fn(),
      getNextPageParam: jest.fn(),
      enabled: true,
    };

    mockUseQueryClient.mockReturnValue(mockQueryClient);
    mockGetV4MultiAccountTransactionsInfiniteQueryOptions.mockReturnValue(
      queryOptions,
    );

    const { result } = renderQueryHook(() => usePrefetchTransactions());

    act(() => {
      result.current();
    });

    expect(mockQueryClient.prefetchInfiniteQuery).toHaveBeenCalledWith(
      expect.objectContaining({ ...queryOptions, staleTime: 300000 }),
    );
  });
});
