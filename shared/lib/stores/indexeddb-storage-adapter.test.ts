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

    it('falls back to browser.storage.local when the item is not in IndexedDB', async () => {
      const fallbackStorage = createFallbackStorage();
      fallbackStorage.getItem.mockResolvedValueOnce({ result: 'legacy-value' });
      const { adapter } = createAdapter({ fallbackStorage });

      await expect(
        adapter.getItem('TestController', 'legacyKey'),
      ).resolves.toStrictEqual({ result: 'legacy-value' });
      expect(fallbackStorage.getItem).toHaveBeenCalledWith(
        'TestController',
        'legacyKey',
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
  });

  describe('getAllKeys', () => {
    it('returns keys from IndexedDB and legacy browser.storage.local storage', async () => {
      const fallbackStorage = createFallbackStorage();
      fallbackStorage.getAllKeys.mockResolvedValueOnce([
        'key2',
        'legacyKey',
      ]);
      const { adapter } = createAdapter({ fallbackStorage });

      await adapter.setItem('TestController', 'key1', 'value1');
      await adapter.setItem('TestController', 'key2', 'value2');

      await expect(adapter.getAllKeys('TestController')).resolves.toStrictEqual(
        ['key1', 'key2', 'legacyKey'],
      );
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
