import 'fake-indexeddb/auto';
import type { StorageAdapter } from '@metamask/storage-service';
import { STORAGE_KEY_PREFIX } from '@metamask/storage-service';
import { IndexedDBStore } from './indexeddb-store';
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

    it('returns false for other errors', () => {
      expect(isIndexedDBMutationBlockedError(new Error('Other error'))).toBe(
        false,
      );
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
      expect(fallbackStorage.getItem).not.toHaveBeenCalled();
    });

    it('promotes a legacy item to IndexedDB without removing it', async () => {
      const databaseName = `test-storage-service-${crypto.randomUUID()}`;
      const database = new IndexedDBStore();
      await database.open(databaseName, 1);
      await database.set({
        [`${STORAGE_KEY_PREFIX}TestController:legacyKey`]: 'stale-value',
      });
      database.close();
      const fallbackStorage = createFallbackStorage();
      fallbackStorage.getItem.mockResolvedValueOnce({ result: 'legacy-value' });
      const { adapter } = createAdapter({ databaseName, fallbackStorage });

      await expect(
        adapter.getItem('TestController', 'legacyKey'),
      ).resolves.toStrictEqual({ result: 'legacy-value' });

      await database.open(databaseName, 1);
      await expect(
        database.get([`${STORAGE_KEY_PREFIX}TestController:legacyKey`]),
      ).resolves.toStrictEqual(['legacy-value']);
      database.close();
      expect(fallbackStorage.getItem).toHaveBeenCalledWith(
        'TestController',
        'legacyKey',
      );
      expect(fallbackStorage.removeItem).not.toHaveBeenCalled();

      await expect(
        adapter.getItem('TestController', 'legacyKey'),
      ).resolves.toStrictEqual({ result: 'legacy-value' });
      expect(fallbackStorage.getItem).toHaveBeenCalledTimes(1);
    });

    it('resynchronizes a legacy item after a background restart', async () => {
      const databaseName = `test-storage-service-${crypto.randomUUID()}`;
      const firstFallbackStorage = createFallbackStorage();
      firstFallbackStorage.getItem.mockResolvedValueOnce({
        result: 'first-value',
      });
      const { adapter: firstAdapter } = createAdapter({
        databaseName,
        fallbackStorage: firstFallbackStorage,
      });

      await expect(
        firstAdapter.getItem('TestController', 'legacyKey'),
      ).resolves.toStrictEqual({ result: 'first-value' });

      const restartedFallbackStorage = createFallbackStorage();
      restartedFallbackStorage.getItem.mockResolvedValueOnce({
        result: 'updated-while-flag-disabled',
      });
      const { adapter: restartedAdapter } = createAdapter({
        databaseName,
        fallbackStorage: restartedFallbackStorage,
      });

      await expect(
        restartedAdapter.getItem('TestController', 'legacyKey'),
      ).resolves.toStrictEqual({ result: 'updated-while-flag-disabled' });

      const database = new IndexedDBStore();
      await database.open(databaseName, 1);
      await expect(
        database.get([`${STORAGE_KEY_PREFIX}TestController:legacyKey`]),
      ).resolves.toStrictEqual(['updated-while-flag-disabled']);
      database.close();
    });

    it('returns the legacy item when promotion fails', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const promotionError = new Error('IndexedDB write failed');
      const fallbackStorage = createFallbackStorage();
      fallbackStorage.getItem.mockResolvedValueOnce({ result: 'legacy-value' });
      const database = {
        get: jest.fn().mockResolvedValue([undefined]),
        getKeys: jest.fn(),
        open: jest.fn().mockResolvedValue(undefined),
        remove: jest.fn(),
        set: jest.fn().mockRejectedValue(promotionError),
      };
      const adapter = new IndexedDBStorageAdapter({
        database,
        fallbackStorage,
      });

      await expect(
        adapter.getItem('TestController', 'legacyKey'),
      ).resolves.toStrictEqual({ result: 'legacy-value' });
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'StorageService: Failed to promote legacy item to IndexedDB: TestController:legacyKey',
        promotionError,
      );
    });

    it('does not restore an IndexedDB item removed while the rollout flag was disabled', async () => {
      const databaseName = `test-storage-service-${crypto.randomUUID()}`;
      const database = new IndexedDBStore();
      const fullKey = `${STORAGE_KEY_PREFIX}TestController:removedKey`;
      await database.open(databaseName, 1);
      await database.set({ [fullKey]: 'stale-value' });
      database.close();
      const { adapter } = createAdapter({ databaseName });

      await expect(
        adapter.getItem('TestController', 'removedKey'),
      ).resolves.toStrictEqual({});

      await database.open(databaseName, 1);
      await expect(database.get([fullKey])).resolves.toStrictEqual([undefined]);
      database.close();
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
      expect(fallbackStorage.setItem).toHaveBeenCalledWith(
        'TestController',
        'myKey',
        { data: 'test' },
      );
    });

    it('falls back to browser.storage.local when IndexedDB mutations are blocked', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const fallbackStorage = createFallbackStorage();
      const blockedError = new DOMException(
        FIREFOX_INDEXED_DB_MUTATION_BLOCKED_ERROR,
        'InvalidStateError',
      );
      const database = {
        get: jest.fn(),
        getKeys: jest.fn(),
        open: jest.fn().mockRejectedValue(blockedError),
        remove: jest.fn(),
        set: jest.fn(),
      };
      const adapter = new IndexedDBStorageAdapter({
        database,
        fallbackStorage,
      });

      await adapter.setItem('TestController', 'myKey', { data: 'test' });

      expect(fallbackStorage.setItem).toHaveBeenCalledWith(
        'TestController',
        'myKey',
        { data: 'test' },
      );
      expect(database.set).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'StorageService: IndexedDB is unavailable; falling back to browser.storage.local.',
      );
    });

    it('updates browser.storage.local before IndexedDB', async () => {
      const fallbackStorage = createFallbackStorage();
      const database = {
        get: jest.fn(),
        getKeys: jest.fn(),
        open: jest.fn().mockResolvedValue(undefined),
        remove: jest.fn(),
        set: jest.fn().mockResolvedValue(undefined),
      };
      const adapter = new IndexedDBStorageAdapter({
        database,
        fallbackStorage,
      });

      await adapter.setItem('TestController', 'myKey', 'value');

      expect(fallbackStorage.setItem.mock.invocationCallOrder[0]).toBeLessThan(
        database.set.mock.invocationCallOrder[0],
      );
    });

    it('retries IndexedDB with a new adapter after a blocked startup', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const fallbackStorage = createFallbackStorage();
      const blockedError = new DOMException(
        FIREFOX_INDEXED_DB_MUTATION_BLOCKED_ERROR,
        'InvalidStateError',
      );
      const database = {
        get: jest.fn(),
        getKeys: jest.fn(),
        open: jest
          .fn()
          .mockRejectedValueOnce(blockedError)
          .mockResolvedValueOnce(undefined),
        remove: jest.fn(),
        set: jest.fn().mockResolvedValue(undefined),
      };
      const firstAdapter = new IndexedDBStorageAdapter({
        database,
        fallbackStorage,
      });

      await firstAdapter.setItem('TestController', 'myKey', 'first-value');

      const restartedAdapter = new IndexedDBStorageAdapter({
        database,
        fallbackStorage,
      });
      await restartedAdapter.setItem('TestController', 'myKey', 'second-value');

      expect(database.open).toHaveBeenCalledTimes(2);
      expect(database.set).toHaveBeenCalledWith({
        [`${STORAGE_KEY_PREFIX}TestController:myKey`]: 'second-value',
      });
      expect(fallbackStorage.setItem).toHaveBeenNthCalledWith(
        2,
        'TestController',
        'myKey',
        'second-value',
      );
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('removeItem', () => {
    it('removes the item from IndexedDB and legacy browser.storage.local storage', async () => {
      const { adapter, fallbackStorage } = createAdapter();

      await adapter.setItem('TestController', 'myKey', { data: 'test' });
      await adapter.removeItem('TestController', 'myKey');

      await expect(
        adapter.getItem('TestController', 'myKey'),
      ).resolves.toStrictEqual({});
      expect(fallbackStorage.removeItem).toHaveBeenCalledWith(
        'TestController',
        'myKey',
      );
    });

    it('uses the legacy removal when IndexedDB mutations are blocked', async () => {
      jest.spyOn(console, 'warn').mockImplementation();
      const fallbackStorage = createFallbackStorage();
      const blockedError = new DOMException(
        FIREFOX_INDEXED_DB_MUTATION_BLOCKED_ERROR,
        'InvalidStateError',
      );
      const database = {
        get: jest.fn(),
        getKeys: jest.fn(),
        open: jest.fn().mockResolvedValue(undefined),
        remove: jest.fn().mockRejectedValue(blockedError),
        set: jest.fn(),
      };
      const adapter = new IndexedDBStorageAdapter({
        database,
        fallbackStorage,
      });

      await expect(
        adapter.removeItem('TestController', 'myKey'),
      ).resolves.toBeUndefined();
      expect(fallbackStorage.removeItem).toHaveBeenCalledWith(
        'TestController',
        'myKey',
      );
    });
  });

  describe('getAllKeys', () => {
    it('returns legacy keys and removes stale IndexedDB keys', async () => {
      const fallbackStorage = createFallbackStorage();
      fallbackStorage.getAllKeys.mockResolvedValueOnce(['key2', 'legacyKey']);
      const { adapter } = createAdapter({ fallbackStorage });

      await adapter.setItem('TestController', 'key1', 'value1');
      await adapter.setItem('TestController', 'key2', 'value2');

      await expect(adapter.getAllKeys('TestController')).resolves.toStrictEqual(
        ['key2', 'legacyKey'],
      );
      await expect(
        adapter.getItem('TestController', 'key1'),
      ).resolves.toStrictEqual({});
    });
  });

  describe('clear', () => {
    it('clears namespace keys from IndexedDB and legacy browser.storage.local storage', async () => {
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
      expect(fallbackStorage.clear).toHaveBeenCalledWith('TestController');
    });
  });
});
