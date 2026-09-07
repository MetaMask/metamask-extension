import { fetchTokenAssets } from '@metamask/assets-controllers';
import type { CaipAssetType } from '@metamask/utils';
import type { TokenAsset } from '@metamask/assets-controllers';
import { fetchTokenAsset } from './token-asset-batcher';

jest.mock('@metamask/assets-controllers', () => ({
  fetchTokenAssets: jest.fn(),
}));

const mockFetchTokenAssets = jest.mocked(fetchTokenAssets);

const usdcAssetId =
  'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as CaipAssetType;
const wethAssetId =
  'eip155:1/erc20:0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' as CaipAssetType;

const createTokenAsset = (assetId: CaipAssetType): TokenAsset =>
  ({
    assetId,
    name: 'Token',
    symbol: 'TKN',
    decimals: 18,
  }) as TokenAsset;

describe('token-asset-batcher', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('batches concurrent fetches into one request', async () => {
    mockFetchTokenAssets.mockResolvedValue([
      createTokenAsset(usdcAssetId),
      createTokenAsset(wethAssetId),
    ]);

    const [usdc, weth] = await Promise.all([
      fetchTokenAsset(usdcAssetId),
      fetchTokenAsset(wethAssetId),
    ]);

    expect(mockFetchTokenAssets).toHaveBeenCalledTimes(1);
    expect(mockFetchTokenAssets).toHaveBeenCalledWith(
      expect.arrayContaining([usdcAssetId, wethAssetId]),
      { includeTokenSecurityData: true },
    );
    expect(usdc?.assetId).toBe(usdcAssetId);
    expect(weth?.assetId).toBe(wethAssetId);
  });

  it('resolves null when the token is missing from the API response', async () => {
    mockFetchTokenAssets.mockResolvedValue([]);

    await expect(fetchTokenAsset(usdcAssetId)).resolves.toBeNull();
  });

  it('resolves tokens from successful chunks when a later chunk fails', async () => {
    const assetIds = Array.from(
      { length: 26 },
      (_, index) => `eip155:1/erc20:0x${String(index).padStart(40, '0')}`,
    ) as CaipAssetType[];

    mockFetchTokenAssets
      .mockResolvedValueOnce(
        assetIds.slice(0, 25).map((assetId) => createTokenAsset(assetId)),
      )
      .mockRejectedValueOnce(new Error('Token API unavailable'));

    const results = await Promise.all(
      assetIds.map((assetId) => fetchTokenAsset(assetId)),
    );

    expect(mockFetchTokenAssets).toHaveBeenCalledTimes(2);
    expect(results[0]?.assetId).toBe(assetIds[0]);
    expect(results[24]?.assetId).toBe(assetIds[24]);
    expect(results[25]).toBeNull();
  });

  it('rejects when every chunk fails', async () => {
    mockFetchTokenAssets.mockRejectedValue(new Error('Token API unavailable'));

    await expect(fetchTokenAsset(usdcAssetId)).rejects.toThrow(
      'Token API unavailable',
    );
  });
});
