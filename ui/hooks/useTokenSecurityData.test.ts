import { renderHook } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import type { TokenSecurityData } from '@metamask/assets-controllers';
import type { CaipAssetType } from '@metamask/utils';
import { fetchCachedTokenAssets } from '../pages/bridge/utils/token-security';
import { useTokenSecurityData } from './useTokenSecurityData';

jest.mock('../pages/bridge/utils/token-security', () => ({
  fetchCachedTokenAssets: jest.fn(),
}));

const mockFetchCachedTokenAssets = jest.mocked(fetchCachedTokenAssets);

const mockSecurityData: TokenSecurityData = {
  resultType: 'Verified',
  maliciousScore: '0',
  features: [
    {
      featureId: 'VERIFIED_CONTRACT',
      type: 'Info',
      description: 'Verified contract',
    },
  ],
  fees: {
    transfer: 0,
    transferFeeMaxAmount: null,
    buy: 0,
    sell: null,
  },
  financialStats: {
    supply: 1000000,
    topHolders: [],
    holdersCount: 100,
    tradeVolume24h: null,
    lockedLiquidityPct: null,
    markets: [],
  },
  metadata: {
    externalLinks: {
      homepage: null,
      twitterPage: null,
      telegramChannelId: null,
    },
  },
  created: '2023-01-01T00:00:00Z',
};

describe('useTokenSecurityData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns prefetched data immediately without fetching', () => {
    const assetId = 'eip155:1/erc20:0x1234' as CaipAssetType;

    const { result } = renderHook(() =>
      useTokenSecurityData({
        assetId,
        prefetchedData: mockSecurityData,
      }),
    );

    expect(result.current.securityData).toBe(mockSecurityData);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockFetchCachedTokenAssets).not.toHaveBeenCalled();
  });

  it('fetches security data when assetId is provided', async () => {
    const assetId = 'eip155:1/erc20:0x1234' as CaipAssetType;
    mockFetchCachedTokenAssets.mockResolvedValue([
      {
        assetId,
        name: 'Test Token',
        symbol: 'TEST',
        decimals: 18,
        securityData: mockSecurityData,
      },
    ]);

    const { result } = renderHook(() => useTokenSecurityData({ assetId }));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetchCachedTokenAssets).toHaveBeenCalledWith([assetId]);
    expect(result.current.securityData).toBe(mockSecurityData);
    expect(result.current.error).toBeNull();
    expect(result.current.symbol).toBe('TEST');
    expect(result.current.decimals).toBe(18);
    expect(result.current.address).toBe('0x1234');
    expect(result.current.isNative).toBe(false);
  });

  it('clears stale data when assetId changes', async () => {
    const firstAssetId = 'eip155:1/erc20:0x1111' as CaipAssetType;
    const secondAssetId = 'eip155:1/erc20:0x2222' as CaipAssetType;
    const secondSecurityData: TokenSecurityData = {
      ...mockSecurityData,
      resultType: 'Warning',
    };

    mockFetchCachedTokenAssets.mockImplementation(async (assetIds) => {
      const assetId = assetIds[0];
      if (assetId === firstAssetId) {
        return [
          {
            assetId: firstAssetId,
            name: 'First Token',
            symbol: 'FIRST',
            decimals: 18,
            securityData: mockSecurityData,
          },
        ];
      }

      return [
        {
          assetId: secondAssetId,
          name: 'Second Token',
          symbol: 'SECOND',
          decimals: 6,
          securityData: secondSecurityData,
        },
      ];
    });

    const { result, rerender } = renderHook(
      ({ assetId }: { assetId: CaipAssetType }) =>
        useTokenSecurityData({ assetId }),
      { initialProps: { assetId: firstAssetId } },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.securityData).toBe(mockSecurityData);
    expect(result.current.symbol).toBe('FIRST');

    rerender({ assetId: secondAssetId });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.securityData).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.address).toBe('0x2222');
    expect(result.current.isNative).toBe(false);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.securityData).toBe(secondSecurityData);
    expect(result.current.symbol).toBe('SECOND');
  });

  it('ignores stale fetch responses when assetId changes quickly', async () => {
    const firstAssetId = 'eip155:1/erc20:0x1111' as CaipAssetType;
    const secondAssetId = 'eip155:1/erc20:0x2222' as CaipAssetType;
    const secondSecurityData: TokenSecurityData = {
      ...mockSecurityData,
      resultType: 'Warning',
    };

    let resolveFirstFetch: (() => void) | undefined;
    const firstFetchPromise = new Promise<void>((resolve) => {
      resolveFirstFetch = () => {
        resolve();
      };
    });

    mockFetchCachedTokenAssets.mockImplementation(async (assetIds) => {
      const requestedAssetId = assetIds[0];

      if (requestedAssetId === firstAssetId) {
        await firstFetchPromise;
        return [
          {
            assetId: firstAssetId,
            name: 'First Token',
            symbol: 'FIRST',
            decimals: 18,
            securityData: mockSecurityData,
          },
        ];
      }

      return [
        {
          assetId: secondAssetId,
          name: 'Second Token',
          symbol: 'SECOND',
          decimals: 6,
          securityData: secondSecurityData,
        },
      ];
    });

    const { result, rerender } = renderHook(
      ({ assetId }: { assetId: CaipAssetType }) =>
        useTokenSecurityData({ assetId }),
      { initialProps: { assetId: firstAssetId } },
    );

    rerender({ assetId: secondAssetId });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.securityData).toBe(secondSecurityData);
    expect(result.current.symbol).toBe('SECOND');

    resolveFirstFetch?.();

    await waitFor(() => {
      expect(mockFetchCachedTokenAssets).toHaveBeenCalledTimes(2);
    });

    expect(result.current.securityData).toBe(secondSecurityData);
    expect(result.current.symbol).toBe('SECOND');
  });

  it('derives native asset metadata from slip44 asset id', async () => {
    const assetId = 'eip155:1/slip44:60' as CaipAssetType;
    mockFetchCachedTokenAssets.mockResolvedValue([
      {
        assetId,
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18,
        securityData: mockSecurityData,
      },
    ]);

    const { result } = renderHook(() => useTokenSecurityData({ assetId }));

    expect(result.current.isNative).toBe(true);
    expect(result.current.address).toBe('60');

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('sets error when fetch fails', async () => {
    const assetId = 'eip155:1/erc20:0x1234' as CaipAssetType;
    mockFetchCachedTokenAssets.mockRejectedValue(new Error('Fetch failed'));

    const { result } = renderHook(() => useTokenSecurityData({ assetId }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual(new Error('Fetch failed'));
    expect(result.current.securityData).toBeNull();
  });
});
