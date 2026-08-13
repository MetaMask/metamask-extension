import type {
  StorageAdapter,
  StorageGetResult,
} from '@metamask/storage-service';
import { STORAGE_KEY_PREFIX } from '@metamask/storage-service';
import {
  STORAGE_SERVICE_INDEXED_DB_FALLBACK_KEY,
  STORAGE_SERVICE_INDEXED_DB_FALLBACK_NAMESPACE,
  STORAGE_SERVICE_INDEXED_DB_NAME,
  STORAGE_SERVICE_INDEXED_DB_VERSION,
} from './indexeddb-storage-constants';
import { IndexedDBStorageAdapter } from './indexeddb-storage-adapter';

const TEST_NAMESPACE = 'TestController';
const TEST_KEY = 'myKey';
const FULL_KEY = `${STORAGE_KEY_PREFIX}${TEST_NAMESPACE}:${TEST_KEY}`;

function createBlockedError(): DOMException {
  return new DOMException(
    'A mutation operation was attempted on a database that did not allow mutations.',
    'InvalidStateError',
  );
}

function createFallbackStorage(): jest.Mocked<StorageAdapter> {
  return {
    clear: jest.fn().mockResolvedValue(undefined),
    getAllKeys: jest.fn().mockResolvedValue([]),
    getItem: jest.fn().mockResolvedValue({}),
    removeItem: jest.fn().mockResolvedValue(undefined),
    setItem: jest.fn().mockResolvedValue(undefined),
  };
}

function createDatabase() {
  return {
    get: jest.fn().mockResolvedValue([undefined]),
    getKeys: jest.fn().mockResolvedValue([]),
    open: jest.fn().mockResolvedValue(undefined),
    remove: jest.fn().mockResolvedValue(undefined),
    set: jest.fn().mockResolvedValue(undefined),
  };
}

type DatabaseMock = ReturnType<typeof createDatabase>;

function createAdapter({
  database = createDatabase(),
  fallbackStorage = createFallbackStorage(),
}: {
  database?: DatabaseMock;
  fallbackStorage?: jest.Mocked<StorageAdapter>;
} = {}) {
  return {
    adapter: new IndexedDBStorageAdapter({ database, fallbackStorage }),
    database,
    fallbackStorage,
  };
}

describe('IndexedDBStorageAdapter', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('when IndexedDB is available', () => {
    it('uses IndexedDB for all storage operations', async () => {
      const { adapter, database, fallbackStorage } = createAdapter();
      database.get.mockResolvedValueOnce([{ data: 'test' }]);
      database.getKeys.mockResolvedValue([FULL_KEY]);

      await adapter.setItem(TEST_NAMESPACE, TEST_KEY, { data: 'test' });
      const value = await adapter.getItem(TEST_NAMESPACE, TEST_KEY);
      const keys = await adapter.getAllKeys(TEST_NAMESPACE);
      await adapter.removeItem(TEST_NAMESPACE, TEST_KEY);
      await adapter.clear(TEST_NAMESPACE);

      expect(database.open).toHaveBeenCalledWith(
        STORAGE_SERVICE_INDEXED_DB_NAME,
        STORAGE_SERVICE_INDEXED_DB_VERSION,
      );
      expect(database.set).toHaveBeenCalledWith({
        [FULL_KEY]: { data: 'test' },
      });
      expect(value).toStrictEqual({ result: { data: 'test' } });
      expect(keys).toStrictEqual([TEST_KEY]);
      expect(database.remove).toHaveBeenCalledWith([FULL_KEY]);
      expect(database.remove).toHaveBeenCalledTimes(2);
      expect(fallbackStorage.setItem).not.toHaveBeenCalled();
    });

    it('returns an empty result when a key is missing', async () => {
      const { adapter } = createAdapter();

      await expect(
        adapter.getItem(TEST_NAMESPACE, TEST_KEY),
      ).resolves.toStrictEqual({});
    });
  });

  describe('when IndexedDB is blocked during open', () => {
    it('pins and delegates all operations to fallback storage', async () => {
      const { adapter, database, fallbackStorage } = createAdapter();
      database.open.mockRejectedValue(createBlockedError());
      fallbackStorage.getItem
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ result: 'fallback-value' });
      fallbackStorage.getAllKeys.mockResolvedValueOnce(['fallback-key']);

      await adapter.setItem(TEST_NAMESPACE, TEST_KEY, 'value');
      const value = await adapter.getItem(TEST_NAMESPACE, TEST_KEY);
      await adapter.removeItem(TEST_NAMESPACE, TEST_KEY);
      const keys = await adapter.getAllKeys(TEST_NAMESPACE);
      await adapter.clear(TEST_NAMESPACE);

      expect(fallbackStorage.setItem).toHaveBeenCalledWith(
        STORAGE_SERVICE_INDEXED_DB_FALLBACK_NAMESPACE,
        STORAGE_SERVICE_INDEXED_DB_FALLBACK_KEY,
        true,
      );
      expect(fallbackStorage.setItem).toHaveBeenCalledWith(
        TEST_NAMESPACE,
        TEST_KEY,
        'value',
      );
      expect(value).toStrictEqual({ result: 'fallback-value' });
      expect(fallbackStorage.removeItem).toHaveBeenCalledWith(
        TEST_NAMESPACE,
        TEST_KEY,
      );
      expect(keys).toStrictEqual(['fallback-key']);
      expect(fallbackStorage.clear).toHaveBeenCalledWith(TEST_NAMESPACE);
      expect(database.open).toHaveBeenCalledTimes(1);
      expect(database.set).not.toHaveBeenCalled();
    });

    it('continues using persisted fallback storage after restart', async () => {
      const database = createDatabase();
      const fallbackStorage = createFallbackStorage();
      fallbackStorage.getItem
        .mockResolvedValueOnce({ result: true })
        .mockResolvedValueOnce({ result: 'fallback-value' });
      const { adapter } = createAdapter({ database, fallbackStorage });

      const result = await adapter.getItem(TEST_NAMESPACE, TEST_KEY);

      expect(result).toStrictEqual({ result: 'fallback-value' });
      expect(database.open).not.toHaveBeenCalled();
    });

    it('retries selection when the fallback marker cannot be written', async () => {
      const markerError = new Error('marker write failed');
      const database = createDatabase();
      database.open.mockRejectedValue(createBlockedError());
      const fallbackStorage = createFallbackStorage();
      fallbackStorage.setItem.mockRejectedValue(markerError);
      const { adapter } = createAdapter({ database, fallbackStorage });

      await expect(
        adapter.setItem(TEST_NAMESPACE, TEST_KEY, 'value'),
      ).rejects.toBe(markerError);
      await expect(
        adapter.setItem(TEST_NAMESPACE, TEST_KEY, 'value'),
      ).rejects.toBe(markerError);

      expect(database.open).toHaveBeenCalledTimes(2);
      expect(fallbackStorage.setItem).not.toHaveBeenCalledWith(
        TEST_NAMESPACE,
        TEST_KEY,
        'value',
      );
    });
  });

  describe('when an IndexedDB operation fails after open', () => {
    it('returns a read error without switching to fallback storage', async () => {
      const databaseError = createBlockedError();
      const { adapter, database, fallbackStorage } = createAdapter();
      database.get.mockRejectedValueOnce(databaseError);

      const result = await adapter.getItem(TEST_NAMESPACE, TEST_KEY);

      expect(result).toStrictEqual({ error: databaseError });
      expect(fallbackStorage.getItem).toHaveBeenCalledTimes(1);
    });

    it('does not switch to fallback storage after a write fails', async () => {
      const databaseError = createBlockedError();
      const { adapter, database, fallbackStorage } = createAdapter();
      database.set.mockRejectedValueOnce(databaseError);

      await expect(
        adapter.setItem(TEST_NAMESPACE, TEST_KEY, 'value'),
      ).rejects.toBe(databaseError);

      expect(fallbackStorage.setItem).not.toHaveBeenCalled();
    });
  });
});
