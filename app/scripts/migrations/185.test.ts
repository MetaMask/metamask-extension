import { jest } from '@jest/globals';
import localforage from 'localforage';
import { migrate, version } from './185';

// Mock localforage after importing it
jest.mock('localforage', () => ({
  keys: jest.fn(),
  removeItem: jest.fn(),
}));

const mockLocalforage = jest.mocked(localforage);

describe(`migration #${version}`, () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock localforage
    mockLocalforage.keys.mockResolvedValue([]);
    mockLocalforage.removeItem.mockResolvedValue(undefined);
  });

  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: 184 },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version });
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('cleans up localforage entries matching price API pattern', async () => {
    const priceApiKey =
      'cachedFetch:https://price.api.cx.metamask.io/v1/chains/137/historical-prices';
    const otherKey = 'cachedFetch:https://other.api.com/data';
    const nonCacheKey = 'someOtherKey';

    mockLocalforage.keys.mockResolvedValue([
      priceApiKey,
      otherKey,
      nonCacheKey,
    ]);

    const oldStorage = {
      meta: { version: 184 },
      data: {},
    };

    await migrate(oldStorage);

    // Should only remove the price API key
    expect(mockLocalforage.removeItem).toHaveBeenCalledTimes(1);
    expect(mockLocalforage.removeItem).toHaveBeenCalledWith(priceApiKey);
  });

  it('handles localforage errors gracefully', async () => {
    mockLocalforage.keys.mockRejectedValue(
      new Error('IndexedDB not available'),
    );

    const oldStorage = {
      meta: { version: 184 },
      data: {},
    };

    // Should not throw an error
    const result = await migrate(oldStorage);

    expect(result.meta.version).toBe(version);
  });

  it('continues migration even if cache cleanup fails', async () => {
    // Mock localforage to throw an error
    mockLocalforage.keys.mockRejectedValue(new Error('localforage error'));

    const oldStorage = {
      meta: { version: 184 },
      data: { someController: { someData: 'test' } },
    };

    // Should not throw an error and should preserve data
    const result = await migrate(oldStorage);

    expect(result.meta.version).toBe(version);
    expect(result.data).toEqual(oldStorage.data);
  });

  it('handles multiple price API cache entries', async () => {
    const priceApiKeys = [
      'cachedFetch:https://price.api.cx.metamask.io/v1/chains/1/historical-prices/0x123',
      'cachedFetch:https://price.api.cx.metamask.io/v1/chains/137/historical-prices/0x456',
      'cachedFetch:https://price.api.cx.metamask.io/v1/chains/56/historical-prices/0x789',
    ];
    const otherKeys = [
      'cachedFetch:https://other.api.com/data',
      'someOtherKey',
    ];

    const allKeys = [...priceApiKeys, ...otherKeys];

    // Mock localforage
    mockLocalforage.keys.mockResolvedValue(allKeys);

    const oldStorage = {
      meta: { version: 184 },
      data: {},
    };

    await migrate(oldStorage);

    // Should remove all 3 price API keys from localforage
    expect(mockLocalforage.removeItem).toHaveBeenCalledTimes(3);
    priceApiKeys.forEach((key) => {
      expect(mockLocalforage.removeItem).toHaveBeenCalledWith(key);
    });
  });
});
