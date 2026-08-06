import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fetchRwas } from '@metamask/assets-controllers';

import { useDiscoverStocksSearch } from './useDiscoverStocksSearch';

jest.mock('@metamask/assets-controllers', () => ({
  fetchRwas: jest.fn(),
}));

const mockFetchRwas = jest.mocked(fetchRwas);

describe('useDiscoverStocksSearch', () => {
  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return function createWrapperElement({
      children,
    }: {
      children: React.ReactNode;
    }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads and merges the next RWA page using the returned cursor', async () => {
    mockFetchRwas
      .mockResolvedValueOnce({
        count: 1,
        totalCount: 2,
        data: [
          {
            assetId: 'eip155:1/erc20:0xstock',
            name: 'Stock one',
            symbol: 'STK1',
            decimals: 18,
            rwaData: {
              price: '1',
              priceChange: '1',
              marketCap: 1,
              aggregatedUsdVolume: 1,
            },
          },
        ],
        pageInfo: { hasNextPage: true, nextCursor: 'next-page' },
      } as never)
      .mockResolvedValueOnce({
        count: 1,
        totalCount: 2,
        data: [
          {
            assetId: 'eip155:1/erc20:0xstock-two',
            name: 'Stock two',
            symbol: 'STK2',
            decimals: 18,
            rwaData: {
              price: '2',
              priceChange: '2',
              marketCap: 2,
              aggregatedUsdVolume: 2,
            },
          },
        ],
        pageInfo: { hasNextPage: false, nextCursor: null },
      } as never);

    const { result } = renderHook(
      () => useDiscoverStocksSearch({ query: 'stock' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.hasNextPage).toBe(true));

    await result.current.fetchNextPage();

    await waitFor(() => expect(result.current.hasNextPage).toBe(false));

    expect(mockFetchRwas).toHaveBeenLastCalledWith(
      expect.objectContaining({ after: 'next-page', query: 'stock' }),
    );
    expect(result.current.data.map(({ symbol }) => symbol)).toStrictEqual([
      'STK1',
      'STK2',
    ]);
    expect(result.current.totalCount).toBe(2);
  });
});
