import type {
  StorageAdapter,
  StorageGetResult,
} from '@metamask/storage-service';
import { STORAGE_KEY_PREFIX } from '@metamask/storage-service';
import {
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
}: {
  database?: DatabaseMock;
} = {}) {
  return {
    adapter: new IndexedDBStorageAdapter({ database }),
    database,
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
      const { adapter, database } = createAdapter();
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
    });

    it('returns an empty result when a key is missing', async () => {
      const { adapter } = createAdapter();

      await expect(
        adapter.getItem(TEST_NAMESPACE, TEST_KEY),
      ).resolves.toStrictEqual({});
    });
  });

  describe('when IndexedDB open fails unexpectedly', () => {
    it('retries storage selection on the next operation', async () => {
      const databaseError = new Error('IndexedDB open failed');
      const { adapter, database } = createAdapter();
      database.open.mockRejectedValueOnce(databaseError);

      await expect(
        adapter.setItem(TEST_NAMESPACE, TEST_KEY, 'value'),
      ).rejects.toBe(databaseError);
      await adapter.setItem(TEST_NAMESPACE, TEST_KEY, 'value');

      expect(database.open).toHaveBeenCalledTimes(2);
      expect(database.set).toHaveBeenCalledWith({ [FULL_KEY]: 'value' });
    });
  });

  describe('when an IndexedDB operation fails after open', () => {
    it('returns a read error', async () => {
      const databaseError = createBlockedError();
      const { adapter, database } = createAdapter();
      database.get.mockRejectedValueOnce(databaseError);

      const result = await adapter.getItem(TEST_NAMESPACE, TEST_KEY);

      expect(result).toStrictEqual({ error: databaseError });
    });
  });
});
