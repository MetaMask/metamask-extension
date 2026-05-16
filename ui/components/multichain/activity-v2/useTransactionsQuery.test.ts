import React from 'react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import {
  act,
  renderHook as renderHookBase,
} from '@testing-library/react-hooks';
import { HttpError } from '@metamask/core-backend';
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
const emptyResponse = {
  data: [],
  pageInfo: {
    count: 0,
    hasNextPage: false,
  },
};
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
  it('normalizes unsupported network api errors to an empty response', async () => {
    const unsupportedNetworksError = new HttpError(
      'http 400: Bad Request',
      400,
      'Bad Request',
      'https://accounts.api.cx.metamask.io/v4/multiaccount/transactions',
      {
        statusCode: 400,
        message:
          'networks param contains no supported chains: eip155:43114, eip155:324',
      },
    );
    mockGetV4MultiAccountTransactionsInfiniteQueryOptions.mockReturnValue({
      queryKey: ['transactions'],
      queryFn: jest.fn().mockRejectedValue(unsupportedNetworksError),
      getNextPageParam: jest.fn(),
      enabled: true,
    });

    renderQueryHook(() => useTransactionsQuery());

    const queryOptions = mockUseInfiniteQuery.mock.calls[0][0];
    await expect(queryOptions.queryFn({})).resolves.toStrictEqual(
      emptyResponse,
    );
  });

  it('keeps unexpected api errors as query errors', async () => {
    const unexpectedError = new HttpError(
      'http 500: Internal Server Error',
      500,
      'Internal Server Error',
      'https://accounts.api.cx.metamask.io/v4/multiaccount/transactions',
      { statusCode: 500, message: 'Unexpected error' },
    );
    mockGetV4MultiAccountTransactionsInfiniteQueryOptions.mockReturnValue({
      queryKey: ['transactions'],
      queryFn: jest.fn().mockRejectedValue(unexpectedError),
      getNextPageParam: jest.fn(),
      enabled: true,
    });

    renderQueryHook(() => useTransactionsQuery());

    const queryOptions = mockUseInfiniteQuery.mock.calls[0][0];
    await expect(queryOptions.queryFn({})).rejects.toBe(unexpectedError);
  });

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
      expect.objectContaining({
        queryKey: queryOptions.queryKey,
        queryFn: expect.any(Function),
        getNextPageParam: queryOptions.getNextPageParam,
        enabled: true,
        retry: false,
        staleTime: 300000,
      }),
    );
  });

  it('prefetches unsupported networks as an empty response', async () => {
    const unsupportedNetworksError = new HttpError(
      'http 400: Bad Request',
      400,
      'Bad Request',
      'https://accounts.api.cx.metamask.io/v4/multiaccount/transactions',
      {
        statusCode: 400,
        message: 'networks param contains no supported chains: eip155:43114',
      },
    );
    const mockQueryClient = {
      getQueryData: jest.fn().mockReturnValue(undefined),
      isFetching: jest.fn().mockReturnValue(0),
      prefetchInfiniteQuery: jest.fn(({ queryFn }) => queryFn({})),
    };
    const queryOptions = {
      queryKey: ['transactions'],
      queryFn: jest.fn().mockRejectedValue(unsupportedNetworksError),
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

    await expect(
      mockQueryClient.prefetchInfiniteQuery.mock.results[0].value,
    ).resolves.toStrictEqual(emptyResponse);
  });
});
