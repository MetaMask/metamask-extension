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
