import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fetchTokenAssets } from '@metamask/assets-controllers';
import type { CaipAssetType } from '@metamask/utils';
import type { TokenAsset } from '@metamask/assets-controllers';
import { getTokenAssetQueryKey } from './tokenAssetQuery';
import { useTokenAssetQueries } from './useTokenAssetQueries';

jest.mock('@metamask/assets-controllers', () => ({
  fetchTokenAssets: jest.fn(),
}));

const mockFetchTokenAssets = jest.mocked(fetchTokenAssets);

const usdcAssetId =
  'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as CaipAssetType;

const createTokenAsset = (resultType: string): TokenAsset =>
  ({
    assetId: usdcAssetId,
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    securityData: {
      resultType,
      features: [],
    },
  }) as unknown as TokenAsset;

describe('useTokenAssetQueries', () => {
  const createWrapper = (queryClient: QueryClient) =>
    function wrapper({ children }: { children: React.ReactNode }) {
      return React.createElement(
        QueryClientProvider,
        { client: queryClient },
        children,
      );
    };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchTokenAssets.mockResolvedValue([]);
  });

  it('returns full token assets by default', async () => {
    const token = createTokenAsset('Verified');
    mockFetchTokenAssets.mockResolvedValue([token]);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const { result } = renderHook(
      () =>
        useTokenAssetQueries({
          assetIds: [usdcAssetId],
        }),
      { wrapper: createWrapper(queryClient) },
    );

    await waitFor(() => {
      expect(result.current[0]?.data).toEqual(token);
    });
  });

  it('applies select to narrow subscribed data', async () => {
    mockFetchTokenAssets.mockResolvedValue([createTokenAsset('Warning')]);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const { result } = renderHook(
      () =>
        useTokenAssetQueries({
          assetIds: [usdcAssetId],
          select: (data) => data?.securityData?.resultType,
        }),
      { wrapper: createWrapper(queryClient) },
    );

    await waitFor(() => {
      expect(result.current[0]?.data).toBe('Warning');
    });
  });

  it('reads from cache without fetching when data is fresh', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(
      getTokenAssetQueryKey(usdcAssetId),
      createTokenAsset('Verified'),
    );

    const { result } = renderHook(
      () =>
        useTokenAssetQueries({
          assetIds: [usdcAssetId],
        }),
      { wrapper: createWrapper(queryClient) },
    );

    await waitFor(() => {
      expect(result.current[0]?.data?.symbol).toBe('USDC');
    });
    expect(mockFetchTokenAssets).not.toHaveBeenCalled();
  });

  it('skips fetching when disabled', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    renderHook(
      () =>
        useTokenAssetQueries({
          assetIds: [usdcAssetId],
          enabled: false,
        }),
      { wrapper: createWrapper(queryClient) },
    );

    await waitFor(() => {
      expect(mockFetchTokenAssets).not.toHaveBeenCalled();
    });
  });
});
