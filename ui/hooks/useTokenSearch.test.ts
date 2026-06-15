import React, { type ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react-hooks';
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
  let browseSpy: jest.SpyInstance;

  beforeEach(() => {
    searchSpy = jest
      .spyOn(tokenSearchApi, 'searchTokens')
      .mockResolvedValue(emptyPage);
    browseSpy = jest
      .spyOn(tokenSearchApi, 'browseTokens')
      .mockResolvedValue(emptyPage);
  });

  afterEach(() => {
    searchSpy.mockRestore();
    browseSpy.mockRestore();
  });

  it('does not hit the API when the (trimmed) query is empty', async () => {
    const { result } = renderHook(() => useTokenSearch({ query: '   ' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isFetching).toBe(false));

    expect(searchSpy).not.toHaveBeenCalled();
    expect(browseSpy).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
  });

  it('uses token search browse when browsing is enabled', async () => {
    const payload = {
      ...emptyPage,
      data: [
        {
          assetId:
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          symbol: 'USDC',
          decimals: 6,
          name: 'USD Coin',
        },
      ],
      count: 1,
      totalCount: 1,
    };
    browseSpy.mockResolvedValueOnce(payload);

    const { result } = renderHook(
      () =>
        useTokenSearch({
          query: '   ',
          networks: ['eip155:59144', 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'],
          enableTokenBrowse: true,
        }),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => expect(result.current.isFetching).toBe(false));

    expect(searchSpy).not.toHaveBeenCalled();
    expect(browseSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        networks: ['eip155:59144', 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'],
      }),
    );
    expect(result.current.data?.data).toStrictEqual(payload.data);
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

  it('fetches the next cursor page and appends it to the exposed response', async () => {
    const firstPage = {
      ...emptyPage,
      data: [
        {
          assetId: 'eip155:1/erc20:0xaaa',
          symbol: 'AAA',
          decimals: 18,
          name: 'Alpha',
        },
      ],
      count: 1,
      totalCount: 2,
      pageInfo: { hasNextPage: true, endCursor: 'MQ==' },
    };
    const secondPage = {
      ...emptyPage,
      data: [
        {
          assetId: 'eip155:1/erc20:0xbbb',
          symbol: 'BBB',
          decimals: 18,
          name: 'Beta',
        },
      ],
      count: 1,
      totalCount: 2,
      pageInfo: { hasNextPage: false, endCursor: 'Mg==' },
    };
    searchSpy
      .mockResolvedValueOnce(firstPage)
      .mockResolvedValueOnce(secondPage);

    const { result } = renderHook(() => useTokenSearch({ query: 'token' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() =>
      expect(result.current.data?.data).toEqual(firstPage.data),
    );

    await act(async () => {
      await result.current.fetchNextPage();
    });

    await waitFor(() =>
      expect(result.current.data?.data).toEqual([
        ...firstPage.data,
        ...secondPage.data,
      ]),
    );
    expect(searchSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        after: 'MQ==',
      }),
    );
  });

  it('fetches the next browse cursor page and appends it to the exposed response', async () => {
    const firstPage = {
      ...emptyPage,
      data: [
        {
          assetId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:AAA',
          symbol: 'AAA',
          decimals: 6,
          name: 'Alpha',
        },
      ],
      count: 1,
      totalCount: 2,
      pageInfo: { hasNextPage: true, endCursor: 'MQ==' },
    };
    const secondPage = {
      ...emptyPage,
      data: [
        {
          assetId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:BBB',
          symbol: 'BBB',
          decimals: 6,
          name: 'Beta',
        },
      ],
      count: 1,
      totalCount: 2,
    };
    browseSpy
      .mockResolvedValueOnce(firstPage)
      .mockResolvedValueOnce(secondPage);

    const { result } = renderHook(
      () =>
        useTokenSearch({
          query: '',
          networks: ['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'],
          enableTokenBrowse: true,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() =>
      expect(result.current.data?.data).toEqual(firstPage.data),
    );

    await act(async () => {
      await result.current.fetchNextPage();
    });

    await waitFor(() =>
      expect(result.current.data?.data).toEqual([
        ...firstPage.data,
        ...secondPage.data,
      ]),
    );
    expect(browseSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ after: 'MQ==' }),
    );
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
    expect(browseSpy).not.toHaveBeenCalled();
  });
});
