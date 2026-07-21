import getFetchWithTimeout from '../fetch-with-timeout';
import {
  canBypassDeepLinkInterstitial,
  isKnownSafeDeepLinkAsset,
  isTokenApiAssetListedAsSafe,
} from './is-known-safe-asset';

jest.mock('../fetch-with-timeout', () => jest.fn());

const mockGetFetchWithTimeout = getFetchWithTimeout as jest.MockedFunction<
  typeof getFetchWithTimeout
>;

describe('isTokenApiAssetListedAsSafe', () => {
  it('returns true when the MetaMask aggregator lists the asset', () => {
    expect(
      isTokenApiAssetListedAsSafe({
        assetId: 'eip155:1/erc20:0x6b175474e89094c44da98b954eedeac495271d0f',
        aggregators: ['metamask', 'oneInch'],
        occurrences: 11,
      }),
    ).toBe(true);
  });

  it('returns true when occurrences meet the floor and a non-dynamic aggregator exists', () => {
    expect(
      isTokenApiAssetListedAsSafe({
        assetId:
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        aggregators: ['jupiter', 'orca'],
        occurrences: 5,
      }),
    ).toBe(true);
  });

  it('returns false for dynamic-only scam listings without enough occurrences', () => {
    expect(
      isTokenApiAssetListedAsSafe({
        assetId: 'eip155:1/erc20:0xb047c8032b99841713b8e3872f06cf32beb27b82',
        aggregators: ['dynamic'],
      }),
    ).toBe(false);
  });

  it('returns false when occurrences are high but aggregators are only dynamic', () => {
    expect(
      isTokenApiAssetListedAsSafe({
        assetId: 'eip155:1/erc20:0xb047c8032b99841713b8e3872f06cf32beb27b82',
        aggregators: ['dynamic'],
        occurrences: 10,
      }),
    ).toBe(false);
  });
});

describe('isKnownSafeDeepLinkAsset', () => {
  const mockFetch = jest.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    mockGetFetchWithTimeout.mockReturnValue(mockFetch);
  });

  it('returns true for native slip44 assets without calling the Tokens API', async () => {
    await expect(
      isKnownSafeDeepLinkAsset('eip155:1/slip44:60'),
    ).resolves.toBe(true);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns false for invalid asset ids', async () => {
    await expect(isKnownSafeDeepLinkAsset('not-caip')).resolves.toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns true when Tokens API lists the asset as safe', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [
        {
          assetId: 'eip155:1/erc20:0x6b175474e89094c44da98b954eedeac495271d0f',
          aggregators: ['metamask'],
          occurrences: 11,
        },
      ],
    });

    await expect(
      isKnownSafeDeepLinkAsset(
        'eip155:1/erc20:0x6b175474e89094c44da98b954eedeac495271d0f',
      ),
    ).resolves.toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(
        'includeAggregators=true&includeOccurrences=true',
      ),
      expect.objectContaining({
        method: 'GET',
        headers: { 'X-Client-Id': 'extension' },
      }),
    );
  });

  it('returns false when Tokens API only returns a dynamic listing', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [
        {
          assetId: 'eip155:1/erc20:0xb047c8032b99841713b8e3872f06cf32beb27b82',
          aggregators: ['dynamic'],
        },
      ],
    });

    await expect(
      isKnownSafeDeepLinkAsset(
        'eip155:1/erc20:0xb047c8032b99841713b8e3872f06cf32beb27b82',
      ),
    ).resolves.toBe(false);
  });

  it('fails closed when the Tokens API request fails', async () => {
    mockFetch.mockRejectedValue(new Error('network down'));

    await expect(
      isKnownSafeDeepLinkAsset(
        'eip155:1/erc20:0x6b175474e89094c44da98b954eedeac495271d0f',
      ),
    ).resolves.toBe(false);
  });
});

describe('canBypassDeepLinkInterstitial', () => {
  const mockFetch = jest.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    mockGetFetchWithTimeout.mockReturnValue(mockFetch);
  });

  it('bypasses for statically whitelisted routes', async () => {
    await expect(
      canBypassDeepLinkInterstitial({ pathname: '/swap' }),
    ).resolves.toBe(true);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('bypasses /asset when Tokens API marks the asset as safe', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [
        {
          assetId: 'eip155:1/erc20:0x6b175474e89094c44da98b954eedeac495271d0f',
          aggregators: ['metamask'],
          occurrences: 11,
        },
      ],
    });

    await expect(
      canBypassDeepLinkInterstitial(
        { pathname: '/asset' },
        new URL(
          'https://link.metamask.io/asset?assetId=eip155:1/erc20:0x6b175474e89094c44da98b954eedeac495271d0f',
        ),
      ),
    ).resolves.toBe(true);
  });

  it('does not bypass /asset for unknown or scam listings', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [
        {
          assetId: 'eip155:1/erc20:0xb047c8032b99841713b8e3872f06cf32beb27b82',
          aggregators: ['dynamic'],
        },
      ],
    });

    await expect(
      canBypassDeepLinkInterstitial(
        { pathname: '/asset' },
        new URL(
          'https://link.metamask.io/asset?assetId=eip155:1/erc20:0xb047c8032b99841713b8e3872f06cf32beb27b82',
        ),
      ),
    ).resolves.toBe(false);
  });
});
