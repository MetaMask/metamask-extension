import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getTrendingTokens, searchTokens } from '@metamask/assets-controllers';

import { MultichainNetworks } from '../../../shared/constants/multichain/networks';
import { useDiscoverCryptoSearch } from './useDiscoverCryptoSearch';

jest.mock('@metamask/assets-controllers', () => ({
  getTrendingTokens: jest.fn(),
  searchTokens: jest.fn(),
}));

const mockGetTrendingTokens = jest.mocked(getTrendingTokens);
const mockSearchTokens = jest.mocked(searchTokens);

describe('useDiscoverCryptoSearch', () => {
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
    mockGetTrendingTokens.mockResolvedValue([]);
  });

  it('loads trending tokens when query is empty', async () => {
    mockGetTrendingTokens.mockResolvedValue([
      {
        assetId: 'eip155:1/slip44:60',
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18,
        price: '2500',
        marketCap: 1,
        aggregatedUsdVolume: 1,
      },
    ]);

    const { result } = renderHook(
      () => useDiscoverCryptoSearch({ query: '' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetTrendingTokens).toHaveBeenCalledWith(
      expect.objectContaining({
        chainIds: expect.arrayContaining([MultichainNetworks.BITCOIN]),
        includeTokenSecurityData: true,
      }),
    );
    expect(mockSearchTokens).not.toHaveBeenCalled();
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0].symbol).toBe('ETH');
  });

  it('searches tokens when query is present', async () => {
    mockSearchTokens.mockResolvedValue({
      count: 2,
      totalCount: 2,
      data: [
        {
          assetId: 'eip155:1/slip44:60',
          name: 'Ethereum',
          symbol: 'ETH',
          decimals: 18,
          price: '2500',
          marketCap: 1,
          aggregatedUsdVolume: 1,
          pricePercentChange1d: '1.2',
          securityData: { resultType: 'Verified' },
        },
        {
          assetId: 'eip155:1/erc20:0xstock',
          name: 'Stock',
          symbol: 'STK',
          decimals: 18,
          rwaData: { type: 'stock' },
        },
      ] as never,
    });

    const { result } = renderHook(
      () => useDiscoverCryptoSearch({ query: 'eth' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockSearchTokens).toHaveBeenCalledWith(
      expect.arrayContaining([MultichainNetworks.BITCOIN]),
      'eth',
      expect.objectContaining({
        includeMarketData: true,
        includeTokenSecurityData: true,
      }),
    );
    expect(result.current.data[0].priceChangePct?.h24).toBe('1.2');
    expect(result.current.totalCount).toBe(2);
  });

  it('merges, deduplicates, and sorts local trending matches into the first search page', async () => {
    mockGetTrendingTokens.mockResolvedValue([
      {
        assetId: 'eip155:1/slip44:60',
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18,
        marketCap: 100,
      },
      {
        assetId: 'eip155:1/erc20:0xgem',
        name: 'Ether Gem',
        symbol: 'GEM',
        decimals: 18,
        marketCap: 500,
      },
      {
        assetId: 'eip155:1/erc20:0xstock',
        name: 'Ether Stock',
        symbol: 'ESTK',
        decimals: 18,
        marketCap: 1_000,
        rwaData: { type: 'stock' },
      },
    ] as never);
    mockSearchTokens
      .mockResolvedValueOnce({
        count: 2,
        totalCount: 5,
        data: [
          {
            assetId: 'eip155:1/slip44:60',
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18,
            price: '2500',
            marketCap: 10,
            aggregatedUsdVolume: 1,
          },
          {
            assetId: 'eip155:1/erc20:0xweth',
            name: 'Wrapped Ether',
            symbol: 'WETH',
            decimals: 18,
            marketCap: 50,
          },
        ],
        pageInfo: { hasNextPage: true, endCursor: 'next-page' },
      } as never)
      .mockResolvedValueOnce({
        count: 3,
        totalCount: 5,
        data: [
          {
            assetId: 'eip155:1/erc20:0xdoge',
            name: 'Dogecoin',
            symbol: 'DOGE',
            decimals: 18,
            marketCap: 1,
          },
          {
            assetId: 'eip155:1/slip44:0',
            name: 'Bitcoin',
            symbol: 'BTC',
            decimals: 8,
            price: '100000',
            marketCap: 1_000,
            aggregatedUsdVolume: 1,
          },
          {
            assetId: 'eip155:1/erc20:0xweth',
            name: 'Wrapped Ether',
            symbol: 'WETH',
            decimals: 18,
            marketCap: 50,
          },
        ],
        pageInfo: { hasNextPage: false, endCursor: null },
      } as never);

    const { result } = renderHook(
      () => useDiscoverCryptoSearch({ query: 'eth' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.hasNextPage).toBe(true));

    await result.current.fetchNextPage();

    await waitFor(() => expect(result.current.hasNextPage).toBe(false));

    expect(mockSearchTokens).toHaveBeenLastCalledWith(
      expect.any(Array),
      'eth',
      expect.objectContaining({ after: 'next-page' }),
    );
    expect(result.current.data.map(({ symbol }) => symbol)).toStrictEqual([
      'GEM',
      'ETH',
      'WETH',
      'DOGE',
      'BTC',
    ]);
    expect(result.current.data).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ symbol: 'ESTK' })]),
    );
    expect(result.current.totalCount).toBe(5);
  });

  it('does not show local trending matches when the API search has no results', async () => {
    mockGetTrendingTokens.mockResolvedValue([
      {
        assetId: 'eip155:1/slip44:60',
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18,
        marketCap: 100,
      },
    ] as never);
    mockSearchTokens.mockResolvedValue({
      count: 0,
      totalCount: 0,
      data: [],
      pageInfo: { hasNextPage: false, endCursor: null },
    } as never);

    const { result } = renderHook(
      () => useDiscoverCryptoSearch({ query: 'eth' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toStrictEqual([]);
  });

  it('merges local trending matches when the API only returns RWA assets', async () => {
    mockGetTrendingTokens.mockResolvedValue([
      {
        assetId: 'eip155:1/slip44:60',
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18,
        marketCap: 100,
      },
    ] as never);
    mockSearchTokens.mockResolvedValue({
      count: 1,
      totalCount: 1,
      data: [
        {
          assetId: 'eip155:1/erc20:0xstock',
          name: 'Ether Stock',
          symbol: 'ESTK',
          decimals: 18,
          rwaData: { type: 'stock' },
        },
      ],
      pageInfo: { hasNextPage: false, endCursor: null },
    } as never);

    const { result } = renderHook(
      () => useDiscoverCryptoSearch({ query: 'eth' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data.map(({ symbol }) => symbol)).toStrictEqual([
      'ETH',
    ]);
  });
});
