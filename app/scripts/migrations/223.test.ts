import { jest } from '@jest/globals';
import browser from 'webextension-polyfill';
import { STORAGE_KEY_PREFIX } from '@metamask/storage-service';
import { PLATFORM_FIREFOX } from '../../../shared/constants/app';
import {
  STORAGE_SERVICE_INDEXED_DB_NAME,
  STORAGE_SERVICE_INDEXED_DB_VERSION,
} from '../../../shared/lib/stores/indexeddb-storage-constants';
import { IndexedDBStore } from '../../../shared/lib/stores/indexeddb-store';
import * as util from '../lib/util';
import { migrate, version } from './223';

jest.mock('webextension-polyfill', () => ({
  runtime: { getManifest: jest.fn(() => ({})) },
  storage: {
    local: {
      get: jest.fn(),
      getKeys: jest.fn(),
      remove: jest.fn(),
    },
  },
}));

const mockBrowser = jest.mocked(browser);
const STORAGE_SERVICE_KEY = `${STORAGE_KEY_PREFIX}TokenListController:tokensChainsCache:0x1`;
const SECOND_STORAGE_SERVICE_KEY = `${STORAGE_KEY_PREFIX}SnapController:sourceCode:npm:test-snap`;

function buildVersionedData() {
  return { meta: { version: version - 1 }, data: {} };
}

function createBlockedError(): DOMException {
  return new DOMException(
    'A mutation operation was attempted on a database that did not allow mutations.',
    'InvalidStateError',
  );
}

function mockStorage(entries: Record<string, unknown>): void {
  mockBrowser.storage.local.getKeys.mockResolvedValue(Object.keys(entries));
  mockBrowser.storage.local.get.mockResolvedValue(entries);
}

function mockIndexedDBStore() {
  return {
    close: jest
      .spyOn(IndexedDBStore.prototype, 'close')
      .mockImplementation(() => undefined),
    get: jest
      .spyOn(IndexedDBStore.prototype, 'get')
      .mockResolvedValue([undefined]),
    open: jest
      .spyOn(IndexedDBStore.prototype, 'open')
      .mockResolvedValue(undefined),
    set: jest
      .spyOn(IndexedDBStore.prototype, 'set')
      .mockResolvedValue(undefined),
  };
}

describe(`migration #${version}`, () => {
  let database: ReturnType<typeof mockIndexedDBStore>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    database = mockIndexedDBStore();
    mockBrowser.storage.local.get.mockResolvedValue({});
    mockBrowser.storage.local.getKeys.mockResolvedValue([]);
    mockBrowser.storage.local.remove.mockResolvedValue(undefined);
  });

  it('updates the version without opening IndexedDB when no keys match', async () => {
    const oldStorage = buildVersionedData();
    mockBrowser.storage.local.getKeys.mockResolvedValueOnce(['unrelated']);

    await migrate(oldStorage, new Set());

    expect(oldStorage.meta.version).toBe(version);
    expect(mockBrowser.storage.local.get).not.toHaveBeenCalled();
    expect(database.open).not.toHaveBeenCalled();
  });

  it('moves missing keys without replacing existing IndexedDB values', async () => {
    const existingValue = { sourceCode: 'indexeddb-source-code' };
    const missingValue = { sourceCode: 'legacy-source-code' };
    mockStorage({
      [STORAGE_SERVICE_KEY]: { sourceCode: 'stale-legacy-source-code' },
      [SECOND_STORAGE_SERVICE_KEY]: missingValue,
      unrelated: 'value',
    });
    database.get.mockResolvedValueOnce([existingValue, undefined]);
    const oldStorage = buildVersionedData();

    await migrate(oldStorage, new Set());

    expect(oldStorage.meta.version).toBe(version);
    expect(database.open).toHaveBeenCalledWith(
      STORAGE_SERVICE_INDEXED_DB_NAME,
      STORAGE_SERVICE_INDEXED_DB_VERSION,
    );
    expect(mockBrowser.storage.local.get).toHaveBeenCalledWith([
      STORAGE_SERVICE_KEY,
      SECOND_STORAGE_SERVICE_KEY,
    ]);
    expect(mockBrowser.storage.local.get).not.toHaveBeenCalledWith(null);
    expect(database.set).toHaveBeenCalledWith({
      [SECOND_STORAGE_SERVICE_KEY]: missingValue,
    });
    expect(mockBrowser.storage.local.remove).toHaveBeenCalledWith([
      STORAGE_SERVICE_KEY,
      SECOND_STORAGE_SERVICE_KEY,
    ]);
    expect(database.close).toHaveBeenCalled();
  });

  it('reads all values when getKeys is unavailable', async () => {
    const storageLocalWithoutGetKeys = mockBrowser.storage.local as {
      get: typeof mockBrowser.storage.local.get;
      getKeys?: typeof mockBrowser.storage.local.getKeys;
    };
    const originalGetKeys = storageLocalWithoutGetKeys.getKeys;
    storageLocalWithoutGetKeys.getKeys = undefined;
    const legacyValue = { sourceCode: 'legacy-source-code' };
    mockBrowser.storage.local.get.mockResolvedValueOnce({
      [STORAGE_SERVICE_KEY]: legacyValue,
    });

    try {
      await migrate(buildVersionedData(), new Set());
    } finally {
      storageLocalWithoutGetKeys.getKeys = originalGetKeys;
    }

    expect(mockBrowser.storage.local.get).toHaveBeenCalledWith(null);
    expect(database.set).toHaveBeenCalledWith({
      [STORAGE_SERVICE_KEY]: legacyValue,
    });
  });

  it('preserves newer IndexedDB data when cleanup is retried', async () => {
    const legacyValue = { sourceCode: 'legacy-source-code' };
    const cleanupError = new Error('storage.local cleanup failed');
    mockStorage({
      [STORAGE_SERVICE_KEY]: legacyValue,
    });
    mockBrowser.storage.local.remove
      .mockRejectedValueOnce(cleanupError)
      .mockResolvedValueOnce(undefined);
    database.get
      .mockResolvedValueOnce([undefined])
      .mockResolvedValueOnce([{ sourceCode: 'newer-indexeddb-source-code' }]);

    // simulate a partially failed migration, where the first attempt to write
    // to indexedDB succeeds, but the removal from storage.local _fails_
    await expect(migrate(buildVersionedData(), new Set())).rejects.toBe(
      cleanupError,
    );
    // indexedDB's `set` _should_ be called here
    expect(database.set).toHaveBeenCalledWith({
      [STORAGE_SERVICE_KEY]: legacyValue,
    });
    // simulate a successful migration
    await migrate(buildVersionedData(), new Set());

    // check that `set` was only ever called the one time (by the first partially
    // failed migration)
    expect(database.set).toHaveBeenCalledTimes(1);

    // finally, check that remove is called for _both_ migrations
    expect(mockBrowser.storage.local.remove).toHaveBeenCalledTimes(2);
  });

  it('does not delete legacy keys when an IndexedDB write fails', async () => {
    const databaseError = new Error('IndexedDB write failed');
    database.set.mockRejectedValueOnce(databaseError);
    mockStorage({
      [STORAGE_SERVICE_KEY]: 'legacy-value',
    });

    await expect(migrate(buildVersionedData(), new Set())).rejects.toBe(
      databaseError,
    );

    expect(mockBrowser.storage.local.remove).not.toHaveBeenCalled();
  });

  it('skips migration on Firefox', async () => {
    jest.spyOn(util, 'getPlatform').mockReturnValue(PLATFORM_FIREFOX);

    const oldStorage = buildVersionedData();

    await migrate(oldStorage, new Set());

    expect(oldStorage.meta.version).toBe(version);
    expect(mockBrowser.storage.local.get).not.toHaveBeenCalled();
    expect(mockBrowser.storage.local.remove).not.toHaveBeenCalled();
  });
});
