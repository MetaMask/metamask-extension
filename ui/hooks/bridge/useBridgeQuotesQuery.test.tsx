import React from 'react';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { isValidQuoteRequest } from '@metamask/bridge-controller';
import {
  selectBridgeQuotesTanStackQueryEnabled,
  useBridgeQuotesQuery,
} from './useBridgeQuotesQuery';

jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: jest.fn(),
  };
});

jest.mock('@metamask/bridge-controller', () => {
  const actual = jest.requireActual('@metamask/bridge-controller');
  return {
    ...actual,
    isValidQuoteRequest: jest.fn(),
  };
});

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn((selector) =>
    selector({
      metamask: {
        remoteFeatureFlags: {},
      },
    }),
  ),
}));

jest.mock('../../ducks/bridge/selectors', () => ({
  getQuoteRequest: jest.fn(() => ({
    walletAddress: '0xabc',
    srcChainId: '0x1',
    destChainId: '0x89',
    srcTokenAddress: '0xsrc',
    destTokenAddress: '0xdest',
    srcTokenAmount: '1000',
    gasIncluded: false,
    gasIncluded7702: false,
  })),
  getQuoteRefreshRate: jest.fn(() => 30_000),
  getBridgeFeatureFlags: jest.fn(() => ({ maxRefreshCount: 5 })),
  getBridgeQuotes: jest.fn(() => ({
    isLoading: false,
    quoteFetchError: null,
    sortedQuotes: [],
    activeQuote: null,
    recommendedQuote: null,
  })),
}));

jest.mock('../../../shared/lib/selectors/remote-feature-flags', () => ({
  getRemoteFeatureFlags: jest.fn((state) => state.metamask.remoteFeatureFlags),
}));

jest.mock('../../store/controller-actions/bridge-controller', () => ({
  fetchQuotes: jest.fn().mockResolvedValue([]),
}));

const mockedUseQuery = jest.mocked(useQuery);
const mockedIsValidQuoteRequest = jest.mocked(isValidQuoteRequest);

const {
  getBridgeQuotes,
} = jest.requireMock('../../ducks/bridge/selectors') as {
  getBridgeQuotes: jest.Mock;
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('selectBridgeQuotesTanStackQueryEnabled', () => {
  it('returns true only when the remote flag is boolean true', () => {
    expect(
      selectBridgeQuotesTanStackQueryEnabled({
        metamask: {
          remoteFeatureFlags: { bridgeQuotesTanStackQuery: true },
        },
      }),
    ).toBe(true);
    expect(
      selectBridgeQuotesTanStackQueryEnabled({
        metamask: {
          remoteFeatureFlags: { bridgeQuotesTanStackQuery: false },
        },
      }),
    ).toBe(false);
    expect(
      selectBridgeQuotesTanStackQueryEnabled({
        metamask: { remoteFeatureFlags: {} },
      }),
    ).toBe(false);
  });
});

describe('useBridgeQuotesQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedIsValidQuoteRequest.mockReturnValue(true);
    getBridgeQuotes.mockReturnValue({
      isLoading: false,
      quoteFetchError: null,
      sortedQuotes: [],
      activeQuote: null,
      recommendedQuote: null,
    });
    mockedUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      dataUpdatedAt: 0,
    } as never);
  });

  it('keeps the query disabled when the remote flag is off', () => {
    const { result } = renderHook(() => useBridgeQuotesQuery(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isQueryEnabled).toBe(false);
    expect(mockedUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false }),
    );
    expect(result.current.quotes).toBeNull();
  });

  it('enables the query when enabled override is true and request is valid', () => {
    mockedUseQuery.mockReturnValue({
      data: [{ quote: { requestId: 'q1' } }],
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      dataUpdatedAt: 123,
    } as never);

    const { result } = renderHook(
      () => useBridgeQuotesQuery({ enabled: true }),
      {
        wrapper: createWrapper(),
      },
    );

    expect(result.current.isQueryEnabled).toBe(true);
    expect(mockedUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: true }),
    );
    expect(result.current.quotes).toEqual([{ quote: { requestId: 'q1' } }]);
    expect(result.current.dataUpdatedAt).toBe(123);
  });

  it('dual-reads loading from Redux when the query path is disabled', () => {
    getBridgeQuotes.mockReturnValue({
      isLoading: true,
      quoteFetchError: null,
      sortedQuotes: [],
      activeQuote: null,
      recommendedQuote: null,
    });

    const { result } = renderHook(() => useBridgeQuotesQuery(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isQueryEnabled).toBe(false);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isError).toBe(false);
  });

  it('prefers TanStack loading/error when the query path is enabled', () => {
    mockedUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: true,
      isError: true,
      error: new Error('quote failed'),
      dataUpdatedAt: 0,
    } as never);

    const { result } = renderHook(
      () => useBridgeQuotesQuery({ enabled: true }),
      {
        wrapper: createWrapper(),
      },
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isFetching).toBe(true);
    expect(result.current.isError).toBe(true);
    expect(result.current.error).toEqual(new Error('quote failed'));
  });

  it('stays disabled when the quote request is invalid', () => {
    mockedIsValidQuoteRequest.mockReturnValue(false);

    const { result } = renderHook(
      () => useBridgeQuotesQuery({ enabled: true }),
      {
        wrapper: createWrapper(),
      },
    );

    expect(result.current.isQueryEnabled).toBe(false);
    expect(mockedUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false }),
    );
  });
});
