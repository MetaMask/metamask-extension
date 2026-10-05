import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { useSelector } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fetchRwas } from '@metamask/assets-controllers';

import { getUseExternalServices } from '../../selectors';
import { getIsSecurityTrustTdpEnabled } from '../../selectors/multichain/feature-flags';
import { useDiscoverStocksSearch } from './useDiscoverStocksSearch';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('@metamask/assets-controllers', () => ({
  fetchRwas: jest.fn(),
}));

const mockFetchRwas = jest.mocked(fetchRwas);
const mockUseSelector = jest.mocked(useSelector);

const selectorState = {
  allowExternalServices: true,
  isSecurityTrustEnabled: true,
};

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
    selectorState.allowExternalServices = true;
    selectorState.isSecurityTrustEnabled = true;
    mockUseSelector.mockImplementation((selector) => {
      if (selector === getUseExternalServices) {
        return selectorState.allowExternalServices;
      }
      if (selector === getIsSecurityTrustTdpEnabled) {
        return selectorState.isSecurityTrustEnabled;
      }
      return undefined;
    });
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

  it('requests token security data and passes it through to the normalized asset', async () => {
    mockFetchRwas.mockResolvedValue({
      count: 1,
      totalCount: 1,
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
          securityData: { resultType: 'Verified' },
        },
      ],
      pageInfo: { hasNextPage: false, nextCursor: null },
    } as never);

    const { result } = renderHook(
      () => useDiscoverStocksSearch({ query: '' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockFetchRwas).toHaveBeenCalledWith(
      expect.objectContaining({ includeTokenSecurityData: true }),
    );
    expect(result.current.data[0].securityData).toStrictEqual({
      resultType: 'Verified',
    });
  });

  it('omits token security data when basic functionality is off', async () => {
    selectorState.allowExternalServices = false;
    mockFetchRwas.mockResolvedValue({
      count: 1,
      totalCount: 1,
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
      pageInfo: { hasNextPage: false, nextCursor: null },
    } as never);

    const { result } = renderHook(
      () => useDiscoverStocksSearch({ query: '' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockFetchRwas.mock.calls[0][0]).not.toHaveProperty(
      'includeTokenSecurityData',
    );
    expect(result.current.data[0].securityData).toBeUndefined();
  });
});
