import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getTrendingTokens, searchTokens } from '@metamask/assets-controllers';

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

    expect(mockGetTrendingTokens).toHaveBeenCalled();
    expect(mockSearchTokens).not.toHaveBeenCalled();
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0].symbol).toBe('ETH');
  });

  it('searches tokens when query is present', async () => {
    mockSearchTokens.mockResolvedValue({
      count: 1,
      totalCount: 1,
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

    expect(mockSearchTokens).toHaveBeenCalled();
    expect(mockGetTrendingTokens).not.toHaveBeenCalled();
    expect(result.current.data[0].priceChangePct?.h24).toBe('1.2');
    expect(result.current.totalCount).toBe(1);
  });
});
