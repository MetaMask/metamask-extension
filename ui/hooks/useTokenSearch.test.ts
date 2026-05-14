import React, { type ReactNode } from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as tokenSearchApi from '../../shared/lib/token-search/token-search-api';
import { useTokenSearch } from './useTokenSearch';

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
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  return Wrapper;
};

describe('useTokenSearch', () => {
  let searchSpy: jest.SpyInstance;

  beforeEach(() => {
    searchSpy = jest
      .spyOn(tokenSearchApi, 'searchTokens')
      .mockResolvedValue(emptyPage);
  });

  afterEach(() => {
    searchSpy.mockRestore();
  });

  it('does not hit the API when the (trimmed) query is empty', async () => {
    const { result } = renderHook(() => useTokenSearch({ query: '   ' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isFetching).toBe(false));

    expect(searchSpy).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
  });

  it('forwards the trimmed query and networks to the API and exposes the raw response', async () => {
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
          query: '  usdc  ',
          networks: ['eip155:1'],
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(searchSpy).toHaveBeenCalledTimes(1));
    expect(searchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        query: 'usdc',
        networks: ['eip155:1'],
      }),
    );

    await waitFor(() => expect(result.current.data).toEqual(payload));
    expect(result.current.error).toBeNull();
  });

  it('surfaces errors from the API on the query result', async () => {
    searchSpy.mockRejectedValueOnce(new Error('boom'));

    const { result } = renderHook(() => useTokenSearch({ query: 'usdc' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect((result.current.error as Error).message).toBe('boom');
  });

  it('is disabled when the consumer passes enabled=false even with a non-empty query', async () => {
    const { result } = renderHook(
      () => useTokenSearch({ query: 'usdc', enabled: false }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isFetching).toBe(false));
    expect(searchSpy).not.toHaveBeenCalled();
  });
});
