import { getStorageItem, setStorageItem } from '../storage-helpers';
import {
  readCachedVaultShareValuations,
  VAULT_SHARE_VALUATION_CACHE_LIMIT,
  writeCachedVaultShareValuations,
} from './vault-share-valuation-cache';
import type { VaultShareValuationCacheEntry } from './vault-share-valuations';

jest.mock('../storage-helpers', () => ({
  getStorageItem: jest.fn(),
  setStorageItem: jest.fn(),
}));

const getStorageItemMock = jest.mocked(getStorageItem);
const setStorageItemMock = jest.mocked(setStorageItem);

const entry = (index: number): VaultShareValuationCacheEntry => ({
  account: '0xaccount',
  chainId: 143,
  vaultAddress: '0xvault',
  txHash: `0x${index.toString(16).padStart(64, '0')}`,
  valuations: [
    {
      type: 'transfer_out',
      blockNumber: index,
      sharesWei: '1000000',
      assetsWei: '1000000',
      assetDecimals: 6,
    },
  ],
});

describe('readCachedVaultShareValuations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the cached entries for a valid document', async () => {
    getStorageItemMock.mockResolvedValue({
      version: 1,
      entries: [entry(1)],
    });

    await expect(readCachedVaultShareValuations()).resolves.toStrictEqual([
      entry(1),
    ]);
  });

  it('returns an empty list when nothing is cached', async () => {
    getStorageItemMock.mockResolvedValue(undefined);

    await expect(readCachedVaultShareValuations()).resolves.toStrictEqual([]);
  });

  it('returns an empty list for a different document version', async () => {
    getStorageItemMock.mockResolvedValue({ version: 2, entries: [entry(1)] });

    await expect(readCachedVaultShareValuations()).resolves.toStrictEqual([]);
  });

  it('returns an empty list for a malformed document', async () => {
    getStorageItemMock.mockResolvedValue({ version: 1, entries: [{}] });

    await expect(readCachedVaultShareValuations()).resolves.toStrictEqual([]);
  });

  it('returns an empty list when a cached amount is not numeric', async () => {
    getStorageItemMock.mockResolvedValue({
      version: 1,
      entries: [
        {
          ...entry(1),
          valuations: [{ ...entry(1).valuations[0], sharesWei: 'abc' }],
        },
      ],
    });

    await expect(readCachedVaultShareValuations()).resolves.toStrictEqual([]);
  });
});

describe('writeCachedVaultShareValuations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getStorageItemMock.mockResolvedValue(undefined);
  });

  it('writes a versioned document', async () => {
    await writeCachedVaultShareValuations([entry(1)]);

    expect(setStorageItemMock).toHaveBeenLastCalledWith(
      'money.activity.vault-share-valuations.v1',
      { version: 1, entries: [entry(1)] },
    );
  });

  it('merges with the entries already stored', async () => {
    getStorageItemMock.mockResolvedValue({
      version: 1,
      entries: [entry(1)],
    });

    await writeCachedVaultShareValuations([entry(2)]);

    expect(setStorageItemMock).toHaveBeenLastCalledWith(
      'money.activity.vault-share-valuations.v1',
      { version: 1, entries: [entry(2), entry(1)] },
    );
  });

  it('caps the cache at the entry limit and keeps the newest activity', async () => {
    const entries = Array.from(
      { length: VAULT_SHARE_VALUATION_CACHE_LIMIT + 1 },
      (_, index) => entry(index),
    );

    await writeCachedVaultShareValuations(entries);

    expect(setStorageItemMock).toHaveBeenLastCalledWith(
      'money.activity.vault-share-valuations.v1',
      { version: 1, entries: [...entries.slice(1)].reverse() },
    );
  });
});
