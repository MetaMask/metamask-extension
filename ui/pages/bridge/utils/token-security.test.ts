import type { TokenAsset } from '@metamask/assets-controllers';
import type { CaipAssetType } from '@metamask/utils';
import {
  fetchCachedTokenAssets,
  getTokenSecurityAssetKey,
} from './token-security';
import { getCacheKey, retrieveCachedResponse, updateCache } from './cache';

const mockFetchTokenAssets = jest.fn();

jest.mock('@metamask/assets-controllers', () => ({
  fetchTokenAssets: (...args: unknown[]) => mockFetchTokenAssets(...args),
}));

jest.mock('./cache', () => ({
  getCacheKey: jest.fn(
    (url: string, body: object) => `${url}:${JSON.stringify(body)}`,
  ),
  retrieveCachedResponse: jest.fn(),
  updateCache: jest.fn(),
}));

const FIRST_ASSET_ID =
  'eip155:1/erc20:0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as CaipAssetType;
const SECOND_ASSET_ID =
  'eip155:1/erc20:0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' as CaipAssetType;

function createToken(assetId: CaipAssetType): TokenAsset {
  return {
    assetId,
    name: 'Token',
    symbol: 'TKN',
    decimals: 18,
  };
}

describe('fetchCachedTokenAssets', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest
      .mocked(getCacheKey)
      .mockImplementation((url, body) => `${url}:${JSON.stringify(body)}`);
    jest.mocked(retrieveCachedResponse).mockResolvedValue(null);
  });

  it('normalizes, deduplicates, and sorts asset IDs', async () => {
    mockFetchTokenAssets.mockResolvedValue([createToken(FIRST_ASSET_ID)]);

    await fetchCachedTokenAssets([
      'eip155:1/erc20:0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB' as CaipAssetType,
      FIRST_ASSET_ID,
      SECOND_ASSET_ID,
    ]);

    expect(mockFetchTokenAssets).toHaveBeenCalledWith(
      [FIRST_ASSET_ID, SECOND_ASSET_ID],
      { includeTokenSecurityData: true },
    );
    expect(getCacheKey).toHaveBeenCalledWith('fetchTokenAssets', {
      assetIds: [FIRST_ASSET_ID, SECOND_ASSET_ID],
      includeTokenSecurityData: true,
    });
  });

  it('returns a persistent cache hit without fetching', async () => {
    const cachedTokens = [createToken(FIRST_ASSET_ID)];
    jest.mocked(retrieveCachedResponse).mockResolvedValue(cachedTokens);

    await expect(fetchCachedTokenAssets([FIRST_ASSET_ID])).resolves.toEqual(
      cachedTokens,
    );
    expect(mockFetchTokenAssets).not.toHaveBeenCalled();
    expect(updateCache).not.toHaveBeenCalled();
  });

  it('deduplicates simultaneous requests for the same cache key', async () => {
    let resolveFetch: (tokens: TokenAsset[]) => void = () => undefined;
    mockFetchTokenAssets.mockReturnValue(
      new Promise<TokenAsset[]>((resolve) => {
        resolveFetch = resolve;
      }),
    );

    const firstRequest = fetchCachedTokenAssets([FIRST_ASSET_ID]);
    const secondRequest = fetchCachedTokenAssets([FIRST_ASSET_ID]);
    await Promise.resolve();
    resolveFetch([createToken(FIRST_ASSET_ID)]);

    await expect(Promise.all([firstRequest, secondRequest])).resolves.toEqual([
      [createToken(FIRST_ASSET_ID)],
      [createToken(FIRST_ASSET_ID)],
    ]);
    expect(mockFetchTokenAssets).toHaveBeenCalledTimes(1);
  });

  it('writes successful responses to the persistent cache', async () => {
    const tokens = [createToken(FIRST_ASSET_ID)];
    mockFetchTokenAssets.mockResolvedValue(tokens);

    await fetchCachedTokenAssets([FIRST_ASSET_ID]);

    expect(updateCache).toHaveBeenCalledWith(
      tokens,
      expect.stringContaining('fetchTokenAssets:'),
    );
  });

  it('does not cache an empty response', async () => {
    mockFetchTokenAssets.mockResolvedValue([]);

    await expect(fetchCachedTokenAssets([FIRST_ASSET_ID])).resolves.toEqual([]);
    expect(updateCache).not.toHaveBeenCalled();
  });

  it('does not cache a failed response', async () => {
    mockFetchTokenAssets.mockRejectedValue(new Error('Request failed'));

    await expect(fetchCachedTokenAssets([FIRST_ASSET_ID])).resolves.toEqual([]);
    expect(updateCache).not.toHaveBeenCalled();
  });
});

describe('getTokenSecurityAssetKey', () => {
  it('preserves case-sensitive non-EVM asset IDs', () => {
    const assetId =
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:AbCd' as CaipAssetType;

    expect(getTokenSecurityAssetKey(assetId)).toBe(assetId);
  });
});
