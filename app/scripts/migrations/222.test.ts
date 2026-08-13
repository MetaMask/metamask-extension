import { jest } from '@jest/globals';
import browser from 'webextension-polyfill';
import { STORAGE_KEY_PREFIX } from '@metamask/storage-service';
import {
  STORAGE_SERVICE_INDEXED_DB_FALLBACK_KEY,
  STORAGE_SERVICE_INDEXED_DB_FALLBACK_NAMESPACE,
  STORAGE_SERVICE_INDEXED_DB_NAME,
  STORAGE_SERVICE_INDEXED_DB_VERSION,
} from '../../../shared/lib/stores/indexeddb-storage-constants';
import { IndexedDBStore } from '../../../shared/lib/stores/indexeddb-store';
import { migrate, version } from './222';

jest.mock('webextension-polyfill', () => ({
  runtime: { getManifest: jest.fn(() => ({})) },
  storage: {
    local: {
      get: jest.fn(),
      getKeys: jest.fn(),
      remove: jest.fn(),
      set: jest.fn(),
    },
  },
}));

const mockBrowser = jest.mocked(browser);
const STORAGE_SERVICE_KEY = `${STORAGE_KEY_PREFIX}TokenListController:tokensChainsCache:0x1`;
const SECOND_STORAGE_SERVICE_KEY = `${STORAGE_KEY_PREFIX}SnapController:sourceCode:npm:test-snap`;
const FALLBACK_MARKER_STORAGE_KEY = `${STORAGE_KEY_PREFIX}${STORAGE_SERVICE_INDEXED_DB_FALLBACK_NAMESPACE}:${STORAGE_SERVICE_INDEXED_DB_FALLBACK_KEY}`;

function buildVersionedData() {
  return { meta: { version: version - 1 }, data: {} };
}

function createBlockedError(): DOMException {
  return new DOMException('Browser-provided message', 'InvalidStateError');
}

function mockStorage(entries: Record<string, unknown>): void {
  mockBrowser.storage.local.getKeys.mockResolvedValueOnce(Object.keys(entries));
  mockBrowser.storage.local.get.mockResolvedValueOnce(entries);
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
    mockBrowser.storage.local.set.mockResolvedValue(undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it('updates the version without opening IndexedDB when no keys match', async () => {
    const oldStorage = buildVersionedData();
    mockBrowser.storage.local.getKeys.mockResolvedValueOnce(['unrelated']);

    await migrate(oldStorage, new Set());

    expect(oldStorage.meta.version).toBe(version);
    expect(mockBrowser.storage.local.get).not.toHaveBeenCalled();
    expect(database.open).not.toHaveBeenCalled();
  });

  it('updates the version when browser storage is unavailable', async () => {
    const browserWithOptionalStorage = mockBrowser as unknown as {
      storage?: typeof mockBrowser.storage;
    };
    const { storage } = browserWithOptionalStorage;
    browserWithOptionalStorage.storage = undefined;
    const oldStorage = buildVersionedData();

    try {
      await migrate(oldStorage, new Set());
    } finally {
      browserWithOptionalStorage.storage = storage;
    }

    expect(oldStorage.meta.version).toBe(version);
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
    expect(database.set).toHaveBeenCalledWith({
      [SECOND_STORAGE_SERVICE_KEY]: missingValue,
    });
    expect(mockBrowser.storage.local.remove).toHaveBeenCalledWith([
      STORAGE_SERVICE_KEY,
      SECOND_STORAGE_SERVICE_KEY,
    ]);
    expect(database.close).toHaveBeenCalled();
  });

  it('preserves newer IndexedDB data when cleanup is retried', async () => {
    const legacyValue = { sourceCode: 'legacy-source-code' };
    const cleanupError = new Error('storage.local cleanup failed');
    mockBrowser.storage.local.getKeys.mockResolvedValue([STORAGE_SERVICE_KEY]);
    mockBrowser.storage.local.get.mockResolvedValue({
      [STORAGE_SERVICE_KEY]: legacyValue,
    });
    mockBrowser.storage.local.remove
      .mockRejectedValueOnce(cleanupError)
      .mockResolvedValueOnce(undefined);
    database.get
      .mockResolvedValueOnce([undefined])
      .mockResolvedValueOnce([{ sourceCode: 'newer-indexeddb-source-code' }]);

    await expect(migrate(buildVersionedData(), new Set())).rejects.toBe(
      cleanupError,
    );
    await migrate(buildVersionedData(), new Set());

    expect(database.set).toHaveBeenCalledTimes(1);
    expect(database.set).toHaveBeenCalledWith({
      [STORAGE_SERVICE_KEY]: legacyValue,
    });
    expect(mockBrowser.storage.local.remove).toHaveBeenCalledTimes(2);
  });

  it('keeps using browser storage when a fallback marker exists', async () => {
    mockStorage({
      [STORAGE_SERVICE_KEY]: 'fallback-value',
      [FALLBACK_MARKER_STORAGE_KEY]: true,
    });

    await migrate(buildVersionedData(), new Set());

    expect(database.open).not.toHaveBeenCalled();
    expect(mockBrowser.storage.local.remove).not.toHaveBeenCalled();
  });

  it('pins browser storage when IndexedDB is blocked during open', async () => {
    database.open.mockRejectedValueOnce(createBlockedError());
    mockStorage({
      [STORAGE_SERVICE_KEY]: 'legacy-value',
    });
    const oldStorage = buildVersionedData();

    await migrate(oldStorage, new Set());

    expect(oldStorage.meta.version).toBe(version);
    expect(mockBrowser.storage.local.set).toHaveBeenCalledWith({
      [FALLBACK_MARKER_STORAGE_KEY]: true,
    });
    expect(mockBrowser.storage.local.remove).not.toHaveBeenCalled();
  });

  it('fails when the fallback marker cannot be persisted', async () => {
    const markerError = new Error('fallback marker write failed');
    database.open.mockRejectedValueOnce(createBlockedError());
    mockStorage({
      [STORAGE_SERVICE_KEY]: 'legacy-value',
    });
    mockBrowser.storage.local.set.mockRejectedValueOnce(markerError);

    await expect(migrate(buildVersionedData(), new Set())).rejects.toBe(
      markerError,
    );

    expect(mockBrowser.storage.local.remove).not.toHaveBeenCalled();
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

  it('reads all storage values when getKeys is unavailable', async () => {
    const storageLocal = mockBrowser.storage.local as {
      get: typeof browser.storage.local.get;
      getKeys?: typeof browser.storage.local.getKeys;
    };
    const { getKeys } = storageLocal;
    storageLocal.getKeys = undefined;
    mockBrowser.storage.local.get.mockResolvedValueOnce({
      [STORAGE_SERVICE_KEY]: 'legacy-value',
      unrelated: 'value',
    });

    try {
      await migrate(buildVersionedData(), new Set());
    } finally {
      storageLocal.getKeys = getKeys;
    }

    expect(mockBrowser.storage.local.get).toHaveBeenCalledWith(null);
    expect(mockBrowser.storage.local.remove).toHaveBeenCalledWith([
      STORAGE_SERVICE_KEY,
    ]);
  });
});
