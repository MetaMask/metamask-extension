import 'fake-indexeddb/auto';
import type {
  StorageAdapter,
  StorageGetResult,
} from '@metamask/storage-service';
import { STORAGE_KEY_PREFIX } from '@metamask/storage-service';
import { IndexedDBStore } from './indexeddb-store';
import {
  STORAGE_SERVICE_INDEXED_DB_FALLBACK_KEY,
  STORAGE_SERVICE_INDEXED_DB_FALLBACK_NAMESPACE,
} from './indexeddb-storage-constants';
import {
  IndexedDBStorageAdapter,
  isIndexedDBMutationBlockedError,
} from './indexeddb-storage-adapter';

const FIREFOX_INDEXED_DB_MUTATION_BLOCKED_ERROR =
  'A mutation operation was attempted on a database that did not allow mutations.';

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

function createAdapter({
  databaseName = `test-storage-service-${crypto.randomUUID()}`,
  fallbackStorage = createFallbackStorage(),
}: {
  databaseName?: string;
  fallbackStorage?: jest.Mocked<StorageAdapter>;
} = {}) {
  return {
    adapter: new IndexedDBStorageAdapter({
      databaseName,
      fallbackStorage,
    }),
    fallbackStorage,
  };
}

describe('IndexedDBStorageAdapter', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('isIndexedDBMutationBlockedError', () => {
    it('returns true for the Firefox private browsing IndexedDB mutation error', () => {
      expect(
        isIndexedDBMutationBlockedError(
          new DOMException(
            FIREFOX_INDEXED_DB_MUTATION_BLOCKED_ERROR,
            'InvalidStateError',
          ),
        ),
      ).toBe(true);
    });

    it('does not depend on the browser-provided error message', () => {
      expect(
        isIndexedDBMutationBlockedError(
          new DOMException(
            'A different browser-provided message',
            'InvalidStateError',
          ),
        ),
      ).toBe(true);
    });

    it('returns false for other errors', () => {
      expect(isIndexedDBMutationBlockedError(new Error('Other error'))).toBe(
        false,
      );
      expect(
        isIndexedDBMutationBlockedError(
          new DOMException('Quota exceeded', 'QuotaExceededError'),
        ),
      ).toBe(false);
    });
  });

  describe('getItem', () => {
    it('returns { result } when the item exists in IndexedDB', async () => {
      const { adapter, fallbackStorage } = createAdapter();

      await adapter.setItem('TestController', 'myKey', { data: 'test' });

      await expect(
        adapter.getItem('TestController', 'myKey'),
      ).resolves.toStrictEqual({
        result: expect.objectContaining({ data: 'test' }),
      });
      expect(fallbackStorage.getItem).toHaveBeenCalledTimes(1);
      expect(fallbackStorage.getItem).toHaveBeenCalledWith(
        STORAGE_SERVICE_INDEXED_DB_FALLBACK_NAMESPACE,
        STORAGE_SERVICE_INDEXED_DB_FALLBACK_KEY,
      );
    });

    it('returns an empty result without reading fallback storage when the item is missing', async () => {
      const fallbackStorage = createFallbackStorage();
      fallbackStorage.getItem.mockImplementation(
        async (namespace): Promise<StorageGetResult> => {
          return namespace === 'TestController'
            ? { result: 'legacy-value' }
            : {};
        },
      );
      const { adapter } = createAdapter({ fallbackStorage });

      await expect(
        adapter.getItem('TestController', 'legacyKey'),
      ).resolves.toStrictEqual({});
      expect(fallbackStorage.getItem).toHaveBeenCalledTimes(1);
      expect(fallbackStorage.getItem).toHaveBeenCalledWith(
        STORAGE_SERVICE_INDEXED_DB_FALLBACK_NAMESPACE,
        STORAGE_SERVICE_INDEXED_DB_FALLBACK_KEY,
      );
    });

    it('returns the error without switching sources when an IndexedDB read fails after open', async () => {
      jest.spyOn(console, 'error').mockImplementation();
      const blockedError = new DOMException(
        FIREFOX_INDEXED_DB_MUTATION_BLOCKED_ERROR,
        'InvalidStateError',
      );
      const database = createDatabase();
      database.get.mockRejectedValueOnce(blockedError);
      const fallbackStorage = createFallbackStorage();
      const adapter = new IndexedDBStorageAdapter({
        database,
        fallbackStorage,
      });

      await expect(
        adapter.getItem('TestController', 'myKey'),
      ).resolves.toStrictEqual({ error: blockedError });
      expect(fallbackStorage.getItem).toHaveBeenCalledTimes(1);
      expect(fallbackStorage.getItem).toHaveBeenCalledWith(
        STORAGE_SERVICE_INDEXED_DB_FALLBACK_NAMESPACE,
        STORAGE_SERVICE_INDEXED_DB_FALLBACK_KEY,
      );
    });
  });

  describe('setItem', () => {
    it('stores the value in IndexedDB with the expected storage service key', async () => {
      const databaseName = `test-storage-service-${crypto.randomUUID()}`;
      const database = new IndexedDBStore();
      const { adapter, fallbackStorage } = createAdapter({ databaseName });

      await adapter.setItem('TestController', 'myKey', { data: 'test' });

      await database.open(databaseName, 1);
      await expect(
        database.get([`${STORAGE_KEY_PREFIX}TestController:myKey`]),
      ).resolves.toStrictEqual([expect.objectContaining({ data: 'test' })]);
      database.close();
      expect(fallbackStorage.setItem).not.toHaveBeenCalled();
    });

    it('uses browser.storage.local when IndexedDB is blocked during open', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const fallbackStorage = createFallbackStorage();
      fallbackStorage.getItem.mockImplementation(
        async (namespace): Promise<StorageGetResult> => {
          return namespace === 'TestController' ? { result: 'fallback' } : {};
        },
      );
      fallbackStorage.getAllKeys.mockResolvedValueOnce(['fallbackKey']);
      const blockedError = new DOMException(
        FIREFOX_INDEXED_DB_MUTATION_BLOCKED_ERROR,
        'InvalidStateError',
      );
      const database = createDatabase();
      database.open.mockRejectedValueOnce(blockedError);
      const adapter = new IndexedDBStorageAdapter({
        database,
        fallbackStorage,
      });

      await adapter.setItem('TestController', 'myKey', { data: 'test' });
      await expect(
        adapter.getItem('TestController', 'myKey'),
      ).resolves.toStrictEqual({ result: 'fallback' });
      await adapter.removeItem('TestController', 'myKey');
      await expect(adapter.getAllKeys('TestController')).resolves.toStrictEqual(
        ['fallbackKey'],
      );
      await adapter.clear('TestController');

      expect(fallbackStorage.setItem).toHaveBeenCalledWith(
        'TestController',
        'myKey',
        { data: 'test' },
      );
      expect(fallbackStorage.setItem).toHaveBeenCalledWith(
        STORAGE_SERVICE_INDEXED_DB_FALLBACK_NAMESPACE,
        STORAGE_SERVICE_INDEXED_DB_FALLBACK_KEY,
        true,
      );
      expect(fallbackStorage.getItem).toHaveBeenCalledWith(
        'TestController',
        'myKey',
      );
      expect(fallbackStorage.removeItem).toHaveBeenCalledWith(
        'TestController',
        'myKey',
      );
      expect(fallbackStorage.getAllKeys).toHaveBeenCalledWith('TestController');
      expect(fallbackStorage.clear).toHaveBeenCalledWith('TestController');
      expect(database.open).toHaveBeenCalledTimes(1);
      expect(database.get).not.toHaveBeenCalled();
      expect(database.getKeys).not.toHaveBeenCalled();
      expect(database.remove).not.toHaveBeenCalled();
      expect(database.set).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'StorageService: IndexedDB is unavailable; falling back to browser.storage.local.',
      );
    });

    it('keeps fallback storage authoritative after IndexedDB becomes available', async () => {
      jest.spyOn(console, 'warn').mockImplementation();
      let fallbackIsPinned = false;
      const fallbackStorage = createFallbackStorage();
      fallbackStorage.getItem.mockImplementation(
        async (namespace, key): Promise<StorageGetResult> => {
          if (
            namespace === STORAGE_SERVICE_INDEXED_DB_FALLBACK_NAMESPACE &&
            key === STORAGE_SERVICE_INDEXED_DB_FALLBACK_KEY
          ) {
            return fallbackIsPinned ? { result: true } : {};
          }

          return { result: 'fallback-value' };
        },
      );
      fallbackStorage.setItem.mockImplementation(
        async (namespace, key, value) => {
          if (
            namespace === STORAGE_SERVICE_INDEXED_DB_FALLBACK_NAMESPACE &&
            key === STORAGE_SERVICE_INDEXED_DB_FALLBACK_KEY &&
            value === true
          ) {
            fallbackIsPinned = true;
          }
        },
      );
      const blockedDatabase = createDatabase();
      blockedDatabase.open.mockRejectedValueOnce(
        new DOMException(
          FIREFOX_INDEXED_DB_MUTATION_BLOCKED_ERROR,
          'InvalidStateError',
        ),
      );
      const blockedAdapter = new IndexedDBStorageAdapter({
        database: blockedDatabase,
        fallbackStorage,
      });

      await blockedAdapter.setItem('TestController', 'myKey', 'first-value');

      const recoveredDatabase = createDatabase();
      const recoveredAdapter = new IndexedDBStorageAdapter({
        database: recoveredDatabase,
        fallbackStorage,
      });
      await expect(
        recoveredAdapter.getItem('TestController', 'myKey'),
      ).resolves.toStrictEqual({ result: 'fallback-value' });

      expect(recoveredDatabase.open).not.toHaveBeenCalled();
      expect(recoveredDatabase.get).not.toHaveBeenCalled();
      expect(fallbackStorage.getItem).toHaveBeenCalledWith(
        'TestController',
        'myKey',
      );
    });

    it('does not switch sources when the fallback marker cannot be persisted', async () => {
      jest.spyOn(console, 'error').mockImplementation();
      const markerError = new Error('fallback marker write failed');
      const fallbackStorage = createFallbackStorage();
      fallbackStorage.setItem.mockRejectedValue(markerError);
      const database = createDatabase();
      database.open.mockRejectedValue(
        new DOMException(
          FIREFOX_INDEXED_DB_MUTATION_BLOCKED_ERROR,
          'InvalidStateError',
        ),
      );
      const adapter = new IndexedDBStorageAdapter({
        database,
        fallbackStorage,
      });

      await expect(
        adapter.setItem('TestController', 'myKey', 'value'),
      ).rejects.toBe(markerError);
      await expect(
        adapter.setItem('TestController', 'myKey', 'value'),
      ).rejects.toBe(markerError);

      expect(database.open).toHaveBeenCalledTimes(2);
      expect(fallbackStorage.setItem).not.toHaveBeenCalledWith(
        'TestController',
        'myKey',
        'value',
      );
    });

    it('does not open IndexedDB when the fallback marker cannot be read', async () => {
      jest.spyOn(console, 'error').mockImplementation();
      const markerError = new Error('fallback marker read failed');
      const fallbackStorage = createFallbackStorage();
      fallbackStorage.getItem.mockResolvedValue({ error: markerError });
      const database = createDatabase();
      const adapter = new IndexedDBStorageAdapter({
        database,
        fallbackStorage,
      });

      await expect(
        adapter.setItem('TestController', 'myKey', 'value'),
      ).rejects.toBe(markerError);

      expect(database.open).not.toHaveBeenCalled();
      expect(database.set).not.toHaveBeenCalled();
      expect(fallbackStorage.setItem).not.toHaveBeenCalled();
    });

    it('rethrows without switching sources when an IndexedDB write fails after open', async () => {
      jest.spyOn(console, 'error').mockImplementation();
      const blockedError = new DOMException(
        FIREFOX_INDEXED_DB_MUTATION_BLOCKED_ERROR,
        'InvalidStateError',
      );
      const database = createDatabase();
      database.set.mockRejectedValueOnce(blockedError);
      const fallbackStorage = createFallbackStorage();
      const adapter = new IndexedDBStorageAdapter({
        database,
        fallbackStorage,
      });

      await expect(
        adapter.setItem('TestController', 'myKey', 'value'),
      ).rejects.toBe(blockedError);

      expect(fallbackStorage.setItem).not.toHaveBeenCalled();
    });

    it('rethrows unexpected IndexedDB errors without writing fallback storage', async () => {
      jest.spyOn(console, 'error').mockImplementation();
      const databaseError = new Error('IndexedDB write failed');
      const database = createDatabase();
      database.set.mockRejectedValueOnce(databaseError);
      const fallbackStorage = createFallbackStorage();
      const adapter = new IndexedDBStorageAdapter({
        database,
        fallbackStorage,
      });

      await expect(
        adapter.setItem('TestController', 'myKey', 'value'),
      ).rejects.toBe(databaseError);
      expect(fallbackStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('removeItem', () => {
    it('removes the item from IndexedDB without mutating fallback storage', async () => {
      const { adapter, fallbackStorage } = createAdapter();

      await adapter.setItem('TestController', 'myKey', { data: 'test' });
      await adapter.removeItem('TestController', 'myKey');

      await expect(
        adapter.getItem('TestController', 'myKey'),
      ).resolves.toStrictEqual({});
      expect(fallbackStorage.removeItem).not.toHaveBeenCalled();
    });

    it('rethrows without switching sources when an IndexedDB removal fails after open', async () => {
      jest.spyOn(console, 'error').mockImplementation();
      const blockedError = new DOMException(
        FIREFOX_INDEXED_DB_MUTATION_BLOCKED_ERROR,
        'InvalidStateError',
      );
      const database = createDatabase();
      database.remove.mockRejectedValueOnce(blockedError);
      const fallbackStorage = createFallbackStorage();
      const adapter = new IndexedDBStorageAdapter({
        database,
        fallbackStorage,
      });

      await expect(adapter.removeItem('TestController', 'myKey')).rejects.toBe(
        blockedError,
      );

      expect(fallbackStorage.removeItem).not.toHaveBeenCalled();
    });
  });

  describe('getAllKeys', () => {
    it('returns only IndexedDB keys without reading fallback storage', async () => {
      const fallbackStorage = createFallbackStorage();
      fallbackStorage.getAllKeys.mockResolvedValueOnce(['key2', 'legacyKey']);
      const { adapter } = createAdapter({ fallbackStorage });

      await adapter.setItem('TestController', 'key1', 'value1');
      await adapter.setItem('TestController', 'key2', 'value2');

      await expect(adapter.getAllKeys('TestController')).resolves.toStrictEqual(
        ['key1', 'key2'],
      );
      expect(fallbackStorage.getAllKeys).not.toHaveBeenCalled();
    });

    it('rethrows without switching sources when listing IndexedDB keys fails after open', async () => {
      jest.spyOn(console, 'error').mockImplementation();
      const blockedError = new DOMException(
        FIREFOX_INDEXED_DB_MUTATION_BLOCKED_ERROR,
        'InvalidStateError',
      );
      const database = createDatabase();
      database.getKeys.mockRejectedValueOnce(blockedError);
      const fallbackStorage = createFallbackStorage();
      fallbackStorage.getAllKeys.mockResolvedValueOnce(['fallbackKey']);
      const adapter = new IndexedDBStorageAdapter({
        database,
        fallbackStorage,
      });

      await expect(adapter.getAllKeys('TestController')).rejects.toBe(
        blockedError,
      );
      expect(fallbackStorage.getAllKeys).not.toHaveBeenCalled();
    });
  });

  describe('clear', () => {
    it('clears namespace keys from IndexedDB without mutating fallback storage', async () => {
      const { adapter, fallbackStorage } = createAdapter();

      await adapter.setItem('TestController', 'key1', 'value1');
      await adapter.setItem('OtherController', 'key2', 'value2');
      await adapter.clear('TestController');

      await expect(
        adapter.getItem('TestController', 'key1'),
      ).resolves.toStrictEqual({});
      await expect(
        adapter.getItem('OtherController', 'key2'),
      ).resolves.toStrictEqual({ result: 'value2' });
      expect(fallbackStorage.clear).not.toHaveBeenCalled();
    });

    it('rethrows without switching sources when clearing IndexedDB keys fails after open', async () => {
      jest.spyOn(console, 'error').mockImplementation();
      const blockedError = new DOMException(
        FIREFOX_INDEXED_DB_MUTATION_BLOCKED_ERROR,
        'InvalidStateError',
      );
      const database = createDatabase();
      database.getKeys.mockRejectedValueOnce(blockedError);
      const fallbackStorage = createFallbackStorage();
      const adapter = new IndexedDBStorageAdapter({
        database,
        fallbackStorage,
      });

      await expect(adapter.clear('TestController')).rejects.toBe(blockedError);

      expect(fallbackStorage.clear).not.toHaveBeenCalled();
    });
  });
});
