import 'fake-indexeddb/auto';
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
import Migrator from '../lib/migrator';
import { migrate, version } from './222';

jest.mock('webextension-polyfill', () => ({
  runtime: {
    getManifest: jest.fn(() => ({})),
  },
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

const OLD_VERSION = version - 1;
const STORAGE_SERVICE_KEY = `${STORAGE_KEY_PREFIX}TokenListController:tokensChainsCache:0x1`;
const SECOND_STORAGE_SERVICE_KEY = `${STORAGE_KEY_PREFIX}SnapController:sourceCode:npm:test-snap`;
const FALLBACK_MARKER_STORAGE_KEY = `${STORAGE_KEY_PREFIX}${STORAGE_SERVICE_INDEXED_DB_FALLBACK_NAMESPACE}:${STORAGE_SERVICE_INDEXED_DB_FALLBACK_KEY}`;

function buildVersionedData() {
  return {
    meta: { version: OLD_VERSION },
    data: {},
  };
}

async function deleteDatabase(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(STORAGE_SERVICE_INDEXED_DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(request.error);
  });
}

async function readIndexedDBValue(key: string): Promise<unknown> {
  const database = new IndexedDBStore();
  await database.open(
    STORAGE_SERVICE_INDEXED_DB_NAME,
    STORAGE_SERVICE_INDEXED_DB_VERSION,
  );
  const [value] = await database.get([key]);
  database.close();
  return value;
}

async function writeIndexedDBValue(key: string, value: unknown): Promise<void> {
  const database = new IndexedDBStore();
  await database.open(
    STORAGE_SERVICE_INDEXED_DB_NAME,
    STORAGE_SERVICE_INDEXED_DB_VERSION,
  );
  await database.set({ [key]: value });
  database.close();
}

describe(`migration #${version}`, () => {
  beforeEach(async () => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    await deleteDatabase();
    mockBrowser.storage.local.get.mockResolvedValue({});
    mockBrowser.storage.local.getKeys.mockResolvedValue([]);
    mockBrowser.storage.local.remove.mockResolvedValue(undefined);
    mockBrowser.storage.local.set.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    await deleteDatabase();
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('updates the version metadata', async () => {
    const oldStorage = buildVersionedData();

    await migrate(oldStorage, new Set());

    expect(oldStorage.meta).toStrictEqual({ version });
  });

  it('does nothing when there are no StorageService keys in browser.storage.local', async () => {
    mockBrowser.storage.local.getKeys.mockResolvedValueOnce(['unrelated']);

    await migrate(buildVersionedData(), new Set());

    expect(mockBrowser.storage.local.get).not.toHaveBeenCalled();
    expect(mockBrowser.storage.local.remove).not.toHaveBeenCalled();
  });

  it('does nothing when browser.storage.local is unavailable', async () => {
    const oldStorage = buildVersionedData();
    const browserWithOptionalStorage = mockBrowser as unknown as {
      storage?: typeof mockBrowser.storage;
    };
    const originalStorage = browserWithOptionalStorage.storage;
    browserWithOptionalStorage.storage = undefined;

    try {
      await migrate(oldStorage, new Set());
    } finally {
      browserWithOptionalStorage.storage = originalStorage;
    }

    expect(oldStorage.meta).toStrictEqual({ version });
  });

  it('moves StorageService keys from browser.storage.local to IndexedDB', async () => {
    const storageServiceValue = {
      timestamp: 1234567890,
      data: { '0xToken': { name: 'Token' } },
    };
    mockBrowser.storage.local.getKeys.mockResolvedValueOnce([
      STORAGE_SERVICE_KEY,
      'unrelated',
    ]);
    mockBrowser.storage.local.get.mockResolvedValueOnce({
      [STORAGE_SERVICE_KEY]: storageServiceValue,
      unrelated: 'value',
    });

    await migrate(buildVersionedData(), new Set());

    await expect(
      readIndexedDBValue(STORAGE_SERVICE_KEY),
    ).resolves.toMatchObject(storageServiceValue);
    expect(mockBrowser.storage.local.remove).toHaveBeenCalledWith([
      STORAGE_SERVICE_KEY,
    ]);
    expect(mockBrowser.storage.local.get).toHaveBeenCalledWith([
      STORAGE_SERVICE_KEY,
    ]);
  });

  it('does not overwrite StorageService keys that already exist in IndexedDB', async () => {
    const indexedDBValue = { sourceCode: 'indexeddb-source-code' };
    const legacyValue = { sourceCode: 'legacy-source-code' };
    await writeIndexedDBValue(STORAGE_SERVICE_KEY, indexedDBValue);
    mockBrowser.storage.local.getKeys.mockResolvedValueOnce([
      STORAGE_SERVICE_KEY,
    ]);
    mockBrowser.storage.local.get.mockResolvedValueOnce({
      [STORAGE_SERVICE_KEY]: legacyValue,
    });

    await migrate(buildVersionedData(), new Set());

    await expect(
      readIndexedDBValue(STORAGE_SERVICE_KEY),
    ).resolves.toMatchObject(indexedDBValue);
    expect(mockBrowser.storage.local.remove).toHaveBeenCalledWith([
      STORAGE_SERVICE_KEY,
    ]);
  });

  it('copies missing keys while preserving keys already in IndexedDB', async () => {
    const indexedDBValue = { sourceCode: 'indexeddb-source-code' };
    const legacyValue = { sourceCode: 'legacy-source-code' };
    const missingValue = { sourceCode: 'missing-source-code' };
    await writeIndexedDBValue(STORAGE_SERVICE_KEY, indexedDBValue);
    mockBrowser.storage.local.getKeys.mockResolvedValueOnce([
      STORAGE_SERVICE_KEY,
      SECOND_STORAGE_SERVICE_KEY,
    ]);
    mockBrowser.storage.local.get.mockResolvedValueOnce({
      [STORAGE_SERVICE_KEY]: legacyValue,
      [SECOND_STORAGE_SERVICE_KEY]: missingValue,
    });

    await migrate(buildVersionedData(), new Set());

    await expect(
      readIndexedDBValue(STORAGE_SERVICE_KEY),
    ).resolves.toMatchObject(indexedDBValue);
    await expect(
      readIndexedDBValue(SECOND_STORAGE_SERVICE_KEY),
    ).resolves.toMatchObject(missingValue);
    expect(mockBrowser.storage.local.remove).toHaveBeenCalledWith([
      STORAGE_SERVICE_KEY,
      SECOND_STORAGE_SERVICE_KEY,
    ]);
  });

  it('preserves newer IndexedDB data when retrying after legacy cleanup fails', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const legacyValue = { sourceCode: 'legacy-source-code' };
    const newerValue = { sourceCode: 'newer-indexeddb-source-code' };
    const cleanupError = new Error('storage.local cleanup failed');
    mockBrowser.storage.local.getKeys.mockResolvedValue([STORAGE_SERVICE_KEY]);
    mockBrowser.storage.local.get.mockResolvedValue({
      [STORAGE_SERVICE_KEY]: legacyValue,
    });
    mockBrowser.storage.local.remove
      .mockRejectedValueOnce(cleanupError)
      .mockResolvedValueOnce(undefined);
    const migrator = new Migrator({ migrations: [{ migrate, version }] });
    const migrationErrorListener = jest.fn();
    migrator.on('error', migrationErrorListener);
    const oldStorage = buildVersionedData();

    const failedMigration = await migrator.migrateData(oldStorage);

    expect(failedMigration.state).toBe(oldStorage);
    expect(failedMigration.state.meta.version).toBe(OLD_VERSION);
    expect(migrationErrorListener).toHaveBeenCalledTimes(1);
    await writeIndexedDBValue(STORAGE_SERVICE_KEY, newerValue);

    const successfulRetry = await migrator.migrateData(failedMigration.state);

    expect(successfulRetry.state.meta.version).toBe(version);
    await expect(
      readIndexedDBValue(STORAGE_SERVICE_KEY),
    ).resolves.toMatchObject(newerValue);
    expect(mockBrowser.storage.local.remove).toHaveBeenCalledTimes(2);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      `Migration #${version}: Failed to migrate StorageService data to IndexedDB:`,
      cleanupError,
    );
  });

  it('removes a fallback marker when a later migration attempt can use IndexedDB', async () => {
    const storageServiceValue = { sourceCode: 'legacy-source-code' };
    await writeIndexedDBValue(STORAGE_SERVICE_KEY, {
      sourceCode: 'stale-indexeddb-source-code',
    });
    mockBrowser.storage.local.getKeys.mockResolvedValueOnce([
      STORAGE_SERVICE_KEY,
      FALLBACK_MARKER_STORAGE_KEY,
    ]);
    mockBrowser.storage.local.get.mockResolvedValueOnce({
      [STORAGE_SERVICE_KEY]: storageServiceValue,
      [FALLBACK_MARKER_STORAGE_KEY]: true,
    });

    await migrate(buildVersionedData(), new Set());

    await expect(
      readIndexedDBValue(STORAGE_SERVICE_KEY),
    ).resolves.toMatchObject(storageServiceValue);
    await expect(
      readIndexedDBValue(FALLBACK_MARKER_STORAGE_KEY),
    ).resolves.toBeUndefined();
    expect(mockBrowser.storage.local.remove).toHaveBeenCalledWith([
      STORAGE_SERVICE_KEY,
      FALLBACK_MARKER_STORAGE_KEY,
    ]);
  });

  it('refreshes IndexedDB from fallback storage on retry while the fallback marker remains', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    let fallbackValue = { sourceCode: 'first-fallback-source-code' };
    const newerFallbackValue = { sourceCode: 'newer-fallback-source-code' };
    const cleanupError = new Error('storage.local cleanup failed');
    mockBrowser.storage.local.getKeys.mockResolvedValue([
      STORAGE_SERVICE_KEY,
      FALLBACK_MARKER_STORAGE_KEY,
    ]);
    mockBrowser.storage.local.get.mockImplementation(async () => ({
      [STORAGE_SERVICE_KEY]: fallbackValue,
      [FALLBACK_MARKER_STORAGE_KEY]: true,
    }));
    mockBrowser.storage.local.remove
      .mockRejectedValueOnce(cleanupError)
      .mockResolvedValueOnce(undefined);
    const migrator = new Migrator({ migrations: [{ migrate, version }] });
    migrator.on('error', jest.fn());
    const oldStorage = buildVersionedData();

    const failedMigration = await migrator.migrateData(oldStorage);

    expect(failedMigration.state).toBe(oldStorage);
    expect(failedMigration.state.meta.version).toBe(OLD_VERSION);
    fallbackValue = newerFallbackValue;

    const successfulRetry = await migrator.migrateData(failedMigration.state);

    expect(successfulRetry.state.meta.version).toBe(version);
    await expect(
      readIndexedDBValue(STORAGE_SERVICE_KEY),
    ).resolves.toMatchObject(newerFallbackValue);
    expect(mockBrowser.storage.local.remove).toHaveBeenCalledTimes(2);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      `Migration #${version}: Failed to migrate StorageService data to IndexedDB:`,
      cleanupError,
    );
  });

  it('rethrows without deleting legacy keys when IndexedDB fails after open', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const blockedError = new DOMException(
      'A different browser-provided message',
      'InvalidStateError',
    );
    jest.spyOn(IndexedDBStore.prototype, 'get').mockRejectedValue(blockedError);
    mockBrowser.storage.local.getKeys.mockResolvedValueOnce([
      STORAGE_SERVICE_KEY,
    ]);
    mockBrowser.storage.local.get.mockResolvedValueOnce({
      [STORAGE_SERVICE_KEY]: { sourceCode: 'legacy-source-code' },
    });

    await expect(migrate(buildVersionedData(), new Set())).rejects.toBe(
      blockedError,
    );

    expect(mockBrowser.storage.local.remove).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      `Migration #${version}: Failed to migrate StorageService data to IndexedDB:`,
      blockedError,
    );
  });

  it('keeps legacy StorageService keys when IndexedDB mutations are blocked', async () => {
    const consoleWarnSpy = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);
    const blockedError = new DOMException(
      'A mutation operation was attempted on a database that did not allow mutations.',
      'InvalidStateError',
    );
    jest
      .spyOn(IndexedDBStore.prototype, 'open')
      .mockRejectedValue(blockedError);
    mockBrowser.storage.local.getKeys.mockResolvedValueOnce([
      STORAGE_SERVICE_KEY,
    ]);
    mockBrowser.storage.local.get.mockResolvedValueOnce({
      [STORAGE_SERVICE_KEY]: { sourceCode: 'legacy-source-code' },
    });

    await migrate(buildVersionedData(), new Set());

    expect(mockBrowser.storage.local.remove).not.toHaveBeenCalled();
    expect(mockBrowser.storage.local.set).toHaveBeenCalledWith({
      [FALLBACK_MARKER_STORAGE_KEY]: true,
    });
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      `Migration #${version}: IndexedDB is unavailable; keeping StorageService data in browser.storage.local.`,
    );
  });

  it('rethrows browser.storage.local access errors', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const storageError = new Error('storage.local failed');
    mockBrowser.storage.local.getKeys.mockRejectedValueOnce(storageError);

    await expect(migrate(buildVersionedData(), new Set())).rejects.toBe(
      storageError,
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      `Migration #${version}: Failed to migrate StorageService data to IndexedDB:`,
      storageError,
    );
  });

  it('rethrows fallback marker write errors so the migration remains pending', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const markerError = new Error('fallback marker write failed');
    jest
      .spyOn(IndexedDBStore.prototype, 'open')
      .mockRejectedValue(
        new DOMException(
          'A mutation operation was attempted on a database that did not allow mutations.',
          'InvalidStateError',
        ),
      );
    mockBrowser.storage.local.getKeys.mockResolvedValueOnce([
      STORAGE_SERVICE_KEY,
    ]);
    mockBrowser.storage.local.get.mockResolvedValueOnce({
      [STORAGE_SERVICE_KEY]: { sourceCode: 'legacy-source-code' },
    });
    mockBrowser.storage.local.set.mockRejectedValueOnce(markerError);
    const migrator = new Migrator({ migrations: [{ migrate, version }] });
    migrator.on('error', jest.fn());
    const oldStorage = buildVersionedData();

    const failedMigration = await migrator.migrateData(oldStorage);

    expect(failedMigration.state).toBe(oldStorage);
    expect(failedMigration.state.meta.version).toBe(OLD_VERSION);
    expect(mockBrowser.storage.local.remove).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      `Migration #${version}: Failed to migrate StorageService data to IndexedDB:`,
      markerError,
    );
  });

  it('rethrows unexpected IndexedDB errors', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const indexedDBError = new Error('IndexedDB failed');
    jest
      .spyOn(IndexedDBStore.prototype, 'open')
      .mockRejectedValue(indexedDBError);
    mockBrowser.storage.local.getKeys.mockResolvedValueOnce([
      STORAGE_SERVICE_KEY,
    ]);
    mockBrowser.storage.local.get.mockResolvedValueOnce({
      [STORAGE_SERVICE_KEY]: { sourceCode: 'legacy-source-code' },
    });

    await expect(migrate(buildVersionedData(), new Set())).rejects.toBe(
      indexedDBError,
    );

    expect(mockBrowser.storage.local.remove).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      `Migration #${version}: Failed to migrate StorageService data to IndexedDB:`,
      indexedDBError,
    );
  });

  it('rethrows IndexedDB write errors without deleting legacy keys', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const indexedDBError = new Error('IndexedDB write failed');
    jest
      .spyOn(IndexedDBStore.prototype, 'set')
      .mockRejectedValue(indexedDBError);
    mockBrowser.storage.local.getKeys.mockResolvedValueOnce([
      STORAGE_SERVICE_KEY,
    ]);
    mockBrowser.storage.local.get.mockResolvedValueOnce({
      [STORAGE_SERVICE_KEY]: { sourceCode: 'legacy-source-code' },
    });

    await expect(migrate(buildVersionedData(), new Set())).rejects.toBe(
      indexedDBError,
    );

    expect(mockBrowser.storage.local.remove).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      `Migration #${version}: Failed to migrate StorageService data to IndexedDB:`,
      indexedDBError,
    );
  });

  it('falls back to get(null) when getKeys is unavailable', async () => {
    const storageServiceValue = { sourceCode: 'legacy-source-code' };
    const storageLocalWithoutGetKeys = mockBrowser.storage.local as {
      get: typeof mockBrowser.storage.local.get;
      remove: typeof mockBrowser.storage.local.remove;
      getKeys?: typeof mockBrowser.storage.local.getKeys;
    };
    const originalGetKeys = storageLocalWithoutGetKeys.getKeys;
    storageLocalWithoutGetKeys.getKeys = undefined;
    mockBrowser.storage.local.get.mockResolvedValueOnce({
      [STORAGE_SERVICE_KEY]: storageServiceValue,
      unrelated: 'value',
    });

    try {
      await migrate(buildVersionedData(), new Set());
    } finally {
      storageLocalWithoutGetKeys.getKeys = originalGetKeys;
    }

    expect(mockBrowser.storage.local.get).toHaveBeenCalledWith(null);
    expect(mockBrowser.storage.local.remove).toHaveBeenCalledWith([
      STORAGE_SERVICE_KEY,
    ]);
  });
});
