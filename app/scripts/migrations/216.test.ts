import 'fake-indexeddb/auto';
import { jest } from '@jest/globals';
import browser from 'webextension-polyfill';
import { STORAGE_KEY_PREFIX } from '@metamask/storage-service';
import {
  STORAGE_SERVICE_INDEXED_DB_NAME,
  STORAGE_SERVICE_INDEXED_DB_VERSION,
} from '../../../shared/lib/stores/indexeddb-storage-adapter';
import { IndexedDBStore } from '../../../shared/lib/stores/indexeddb-store';
import { migrate, version } from './216';

jest.mock('webextension-polyfill', () => ({
  storage: {
    local: {
      get: jest.fn(),
      remove: jest.fn(),
    },
  },
}));

const mockBrowser = jest.mocked(browser);

const OLD_VERSION = version - 1;
const STORAGE_SERVICE_KEY = `${STORAGE_KEY_PREFIX}TokenListController:tokensChainsCache:0x1`;

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

describe(`migration #${version}`, () => {
  beforeEach(async () => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    await deleteDatabase();
    mockBrowser.storage.local.get.mockResolvedValue({});
    mockBrowser.storage.local.remove.mockResolvedValue(undefined);
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

  it('does nothing when there are no storageService keys in browser.storage.local', async () => {
    const oldStorage = buildVersionedData();
    mockBrowser.storage.local.get.mockResolvedValueOnce({
      unrelated: 'value',
    });

    await migrate(oldStorage, new Set());

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

  it('moves storageService keys from browser.storage.local to IndexedDB', async () => {
    const storageServiceValue = {
      timestamp: 1234567890,
      data: { '0xToken': { name: 'Token' } },
    };
    const oldStorage = buildVersionedData();
    mockBrowser.storage.local.get.mockResolvedValueOnce({
      [STORAGE_SERVICE_KEY]: storageServiceValue,
      unrelated: 'value',
    });

    await migrate(oldStorage, new Set());

    await expect(
      readIndexedDBValue(STORAGE_SERVICE_KEY),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          '0xToken': expect.objectContaining({ name: 'Token' }),
        }),
        timestamp: 1234567890,
      }),
    );
    expect(mockBrowser.storage.local.remove).toHaveBeenCalledWith([
      STORAGE_SERVICE_KEY,
    ]);
  });

  it('does not overwrite storageService keys that already exist in IndexedDB', async () => {
    const indexedDBValue = { sourceCode: 'indexeddb-source-code' };
    const legacyValue = { sourceCode: 'legacy-source-code' };
    const database = new IndexedDBStore();
    await database.open(
      STORAGE_SERVICE_INDEXED_DB_NAME,
      STORAGE_SERVICE_INDEXED_DB_VERSION,
    );
    await database.set({ [STORAGE_SERVICE_KEY]: indexedDBValue });
    database.close();
    mockBrowser.storage.local.get.mockResolvedValueOnce({
      [STORAGE_SERVICE_KEY]: legacyValue,
    });

    await migrate(buildVersionedData(), new Set());

    await expect(
      readIndexedDBValue(STORAGE_SERVICE_KEY),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        sourceCode: 'indexeddb-source-code',
      }),
    );
    expect(mockBrowser.storage.local.remove).toHaveBeenCalledWith([
      STORAGE_SERVICE_KEY,
    ]);
  });

  it('keeps legacy storageService keys when IndexedDB mutations are blocked', async () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const blockedError = new DOMException(
      'A mutation operation was attempted on a database that did not allow mutations.',
      'InvalidStateError',
    );
    jest
      .spyOn(IndexedDBStore.prototype, 'open')
      .mockRejectedValue(blockedError);
    mockBrowser.storage.local.get.mockResolvedValueOnce({
      [STORAGE_SERVICE_KEY]: { sourceCode: 'legacy-source-code' },
    });

    await migrate(buildVersionedData(), new Set());

    expect(mockBrowser.storage.local.remove).not.toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      `Migration #${version}: IndexedDB is unavailable; keeping StorageService data in browser.storage.local.`,
    );
  });

  it('does not throw when migration storage access fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const storageError = new Error('storage.local failed');
    mockBrowser.storage.local.get.mockRejectedValueOnce(storageError);
    const oldStorage = buildVersionedData();

    await migrate(oldStorage, new Set());

    expect(oldStorage.meta).toStrictEqual({ version });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      `Migration #${version}: Failed to migrate StorageService data to IndexedDB:`,
      storageError,
    );
  });
});
