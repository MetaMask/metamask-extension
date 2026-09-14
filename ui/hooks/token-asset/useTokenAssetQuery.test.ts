import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fetchTokenAssets } from '@metamask/assets-controllers';
import type { CaipAssetType } from '@metamask/utils';
import type { TokenAsset } from '@metamask/assets-controllers';
import { getTokenAssetQueryKey } from './token-asset-query';
import { useTokenAssetQuery } from './useTokenAssetQuery';

jest.mock('@metamask/assets-controllers', () => ({
  fetchTokenAssets: jest.fn(),
}));

const mockFetchTokenAssets = jest.mocked(fetchTokenAssets);

const usdcAssetId =
  'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as CaipAssetType;

const usdcToken = {
  assetId: usdcAssetId,
  name: 'USD Coin',
  symbol: 'USDC',
  decimals: 6,
  securityData: {
    resultType: 'Verified',
    features: [],
  },
} as unknown as TokenAsset;

describe('useTokenAssetQuery', () => {
  const createWrapper = (queryClient?: QueryClient) => {
    const client =
      queryClient ??
      new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });

    return function wrapper({ children }: { children: React.ReactNode }) {
      return React.createElement(QueryClientProvider, { client }, children);
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchTokenAssets.mockResolvedValue([usdcToken]);
  });

  it('does not fetch when fetchOnMiss is false', async () => {
    const { result } = renderHook(
      () => useTokenAssetQuery({ assetId: usdcAssetId, fetchOnMiss: false }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false);
    });

    expect(mockFetchTokenAssets).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
  });

  it('reads cache written by setQueryData when fetchOnMiss is false', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(getTokenAssetQueryKey(usdcAssetId), usdcToken);

    const { result } = renderHook(
      () => useTokenAssetQuery({ assetId: usdcAssetId, fetchOnMiss: false }),
      { wrapper: createWrapper(queryClient) },
    );

    expect(result.current.data).toEqual(usdcToken);
    expect(mockFetchTokenAssets).not.toHaveBeenCalled();
  });

  it('fetches a single asset when fetchOnMiss is true', async () => {
    const { result } = renderHook(
      () => useTokenAssetQuery({ assetId: usdcAssetId, fetchOnMiss: true }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetchTokenAssets).toHaveBeenCalledWith([usdcAssetId], {
      includeTokenSecurityData: true,
    });
    expect(result.current.data).toEqual(usdcToken);
  });

  it('does not fetch when assetId is invalid', async () => {
    renderHook(
      () =>
        useTokenAssetQuery({
          assetId: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          fetchOnMiss: true,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(mockFetchTokenAssets).not.toHaveBeenCalled();
    });
  });
});
