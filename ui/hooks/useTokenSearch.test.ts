import React, { type ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTokenSearch } from './useTokenSearch';
import * as tokenSearchApi from '../../shared/lib/token-search/token-search-api';

const emptyPage = {
  data: [],
  count: 0,
  totalCount: 0,
  pageInfo: { hasNextPage: false, endCursor: '' },
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { children?: ReactNode }) =>
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  return Wrapper;
};

describe('useTokenSearch', () => {
  let searchSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    searchSpy = jest
      .spyOn(tokenSearchApi, 'searchTokens')
      .mockResolvedValue(emptyPage);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    searchSpy.mockRestore();
  });

  it('does not hit the API when the query is empty', () => {
    renderHook(() => useTokenSearch({ query: '   ' }), {
      wrapper: createWrapper(),
    });

    act(() => {
      jest.advanceTimersByTime(1_000);
    });

    expect(searchSpy).not.toHaveBeenCalled();
  });

  it('debounces requests and maps state into the response payload', async () => {
    const payload = {
      ...emptyPage,
      data: [
        {
          assetId: 'eip155:1/erc20:0xaaa',
          symbol: 'USDC',
          decimals: 6,
          name: 'USD Coin',
        },
      ],
      count: 1,
      totalCount: 1,
      pageInfo: { hasNextPage: true, endCursor: 'MQ==' },
    };
    searchSpy.mockResolvedValueOnce(payload);

    const { result } = renderHook(
      () =>
        useTokenSearch({
          query: 'usdc',
          networks: ['eip155:1'],
          debounceMs: 200,
        }),
      { wrapper: createWrapper() },
    );

    expect(searchSpy).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(200);
      await Promise.resolve();
    });

    await waitFor(() => expect(searchSpy).toHaveBeenCalledTimes(1));
    expect(searchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        query: 'usdc',
        networks: ['eip155:1'],
      }),
    );
    await waitFor(() => expect(result.current.results).toEqual(payload.data));
    expect(result.current.hasNextPage).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('surfaces errors and clears results when the API throws', async () => {
    searchSpy.mockRejectedValueOnce(new Error('boom'));

    const { result } = renderHook(
      () => useTokenSearch({ query: 'usdc', debounceMs: 100 }),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      jest.advanceTimersByTime(100);
      await Promise.resolve();
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.results).toEqual([]);
  });

  it('clears results immediately when the query becomes empty', async () => {
    searchSpy.mockResolvedValueOnce({
      ...emptyPage,
      data: [
        {
          assetId: 'eip155:1/erc20:0xaaa',
          symbol: 'USDC',
          decimals: 6,
          name: 'USD Coin',
        },
      ],
      count: 1,
      totalCount: 1,
    });
    const { result, rerender } = renderHook(
      ({ query }: { query: string }) =>
        useTokenSearch({ query, debounceMs: 50 }),
      { initialProps: { query: 'usdc' }, wrapper: createWrapper() },
    );

    await act(async () => {
      jest.advanceTimersByTime(50);
      await Promise.resolve();
    });
    await waitFor(() => expect(result.current.results.length).toBe(1));

    rerender({ query: '' });

    expect(result.current.results).toEqual([]);
    expect(result.current.hasQuery).toBe(false);
  });
});
