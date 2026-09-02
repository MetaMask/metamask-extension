import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fetchTokenAssets } from '@metamask/assets-controllers';
import type { CaipAssetType } from '@metamask/utils';
import type { TokenAsset } from '@metamask/assets-controllers';
import { getUseExternalServices } from '../../selectors';
import { usePrefetchTokenAssets } from './usePrefetchTokenAssets';
import { getTokenAssetQueryKey } from './tokenAssetQuery';

jest.mock('@metamask/assets-controllers', () => ({
  fetchTokenAssets: jest.fn(),
}));

jest.mock('../../selectors', () => ({
  getUseExternalServices: jest.fn(),
}));

jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) => selector({}),
}));

const mockGetUseExternalServices = jest.mocked(getUseExternalServices);

const mockFetchTokenAssets = jest.mocked(fetchTokenAssets);

const usdcAssetId =
  'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as CaipAssetType;
const wethAssetId =
  'eip155:1/erc20:0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' as CaipAssetType;

const createTokenAsset = (
  assetId: CaipAssetType,
  resultType = 'Verified',
): TokenAsset =>
  ({
    assetId,
    name: 'Token',
    symbol: 'TKN',
    decimals: 18,
    securityData: {
      resultType,
      features: [],
    },
  }) as unknown as TokenAsset;

describe('usePrefetchTokenAssets', () => {
  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        children,
      );

    return { queryClient, wrapper };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchTokenAssets.mockResolvedValue([]);
    mockGetUseExternalServices.mockReturnValue(true);
  });

  it('skips fetching when external services are off', async () => {
    mockGetUseExternalServices.mockReturnValue(false);
    const { wrapper } = createWrapper();

    renderHook(
      () =>
        usePrefetchTokenAssets({
          assetIds: [usdcAssetId],
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(mockFetchTokenAssets).not.toHaveBeenCalled();
    });
  });

  it('fetches missing assets and writes each token to the cache', async () => {
    const usdc = createTokenAsset(usdcAssetId);
    const weth = createTokenAsset(wethAssetId, 'Warning');
    mockFetchTokenAssets.mockResolvedValue([usdc, weth]);
    const { queryClient, wrapper } = createWrapper();

    renderHook(
      () =>
        usePrefetchTokenAssets({
          assetIds: [usdcAssetId, wethAssetId],
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(mockFetchTokenAssets).toHaveBeenCalledTimes(1);
    });

    expect(mockFetchTokenAssets).toHaveBeenCalledWith(
      expect.arrayContaining([usdcAssetId, wethAssetId]),
      { includeTokenSecurityData: true },
    );
    expect(mockFetchTokenAssets.mock.calls[0][0]).toHaveLength(2);
    expect(
      queryClient.getQueryData(getTokenAssetQueryKey(usdcAssetId)),
    ).toEqual(usdc);
    expect(
      queryClient.getQueryData(getTokenAssetQueryKey(wethAssetId)),
    ).toEqual(weth);
  });

  it('skips assets that already have fresh cache data', async () => {
    const usdc = createTokenAsset(usdcAssetId);
    const { queryClient, wrapper } = createWrapper();
    queryClient.setQueryData(getTokenAssetQueryKey(usdcAssetId), usdc);

    renderHook(
      () =>
        usePrefetchTokenAssets({
          assetIds: [usdcAssetId],
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(mockFetchTokenAssets).not.toHaveBeenCalled();
    });
  });

  it('deduplicates mixed-case EVM asset ids', async () => {
    mockFetchTokenAssets.mockResolvedValue([createTokenAsset(usdcAssetId)]);
    const { wrapper } = createWrapper();

    renderHook(
      () =>
        usePrefetchTokenAssets({
          assetIds: [
            'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            usdcAssetId,
          ],
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(mockFetchTokenAssets).toHaveBeenCalledTimes(1);
    });

    expect(mockFetchTokenAssets.mock.calls[0][0]).toEqual([usdcAssetId]);
  });
});
