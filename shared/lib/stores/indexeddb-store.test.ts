import 'fake-indexeddb/auto';
import { IndexedDBStore } from './indexeddb-store';

describe('IndexedDBStore', () => {
  const dbName = 'test-db';
  const dbVersion = 1;
  let db: IndexedDBStore;

  // Ensure a clean state before each test by deleting the database
  beforeEach(async () => {
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase(dbName);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      req.onblocked = () => {
        throw new Error("this shouldn't happen. You have an error somewhere");
      };
    });
    db = new IndexedDBStore();
  });
  afterEach(() => {
    db?.close();
  });

  describe('open', () => {
    it('opens the database successfully and creates store on first open', async () => {
      await db.open(dbName, dbVersion);
      // Verify the database is open by performing an operation
      await db.set({ key: 'value' });
      const values = await db.get(['key']);
      expect(values).toStrictEqual(['value']);
    });

    it('rejects with TypeError for invalid version (0)', async () => {
      await expect(db.open(dbName, 0)).rejects.toThrow(TypeError);
    });

    it('handles opening errors', async () => {
      await db.open(dbName, dbVersion + 1);
      db.close();
      db = new IndexedDBStore();
      // trigger a "VersionError" by trying to open the database with a
      // an _earlier_ different version number
      await expect(db.open(dbName, dbVersion)).rejects.toThrow(Error);
    });

    it('handles database version upgrades', async () => {
      await db.open(dbName, dbVersion);
      await db.set({ key: 'value' });
      db.close();
      db = new IndexedDBStore();
      await db.open(dbName, dbVersion + 1);
      const [value] = (await db.get(['key'])) as string[];
      expect(value).toBe('value');
    });

    it('does not reopen if already open', async () => {
      const openSpy = jest.spyOn(indexedDB, 'open');
      await db.open(dbName, dbVersion);
      expect(openSpy).toHaveBeenCalled();
      openSpy.mockRestore();
      await db.open(dbName, dbVersion);
      expect(openSpy).not.toHaveBeenCalled();
      openSpy.mockRestore();
    });
  });

  describe('set', () => {
    it('sets multiple key-value pairs successfully', async () => {
      await db.open(dbName, dbVersion);
      const values = { key1: 'value1', key2: 42, key3: { nested: true } };
      await db.set(values);
      const retrieved = await db.get(['key1', 'key2', 'key3']);
      expect(retrieved[0]).toBe('value1');
      expect(retrieved[1]).toBe(42);
      expect(retrieved[2]).toMatchObject({ nested: true });
    });

    it('throws when database is not open', async () => {
      await expect(db.set({ key: 'value' })).rejects.toThrow(
        'Database is not open',
      );
    });

    it('rejects on transaction error with non-serializable value', async () => {
      await db.open(dbName, dbVersion);
      const values = {
        // Functions are not serializable, so this will ensure an error:
        key: () => {
          return undefined;
        },
      };
      // don't matter exactly what the error
      // is, we just need to ensure that it does propagate errors.
      await expect(db.set(values)).rejects.toThrow('could not be cloned');
    });
  });

  describe('get', () => {
    it('gets multiple keys, preserving order and duplicates, with undefined for missing keys', async () => {
      await db.open(dbName, dbVersion);
      await db.set({ key1: 'value1', key2: 'value2' });
      const retrieved = await db.get(['key1', 'key3', 'key2', 'key1']);
      expect(retrieved).toStrictEqual([
        'value1',
        undefined,
        'value2',
        'value1',
      ]);
    });

    it('throws when database is not open', async () => {
      await expect(db.get(['key'])).rejects.toThrow('Database is not open');
    });
  });

  describe('getKeys', () => {
    it('returns keys matching a prefix', async () => {
      await db.open(dbName, dbVersion);
      await db.set({
        'prefix:key1': 'value1',
        'prefix:key2': 'value2',
        other: 'value3',
      });

      expect(await db.getKeys('prefix:')).toStrictEqual([
        'prefix:key1',
        'prefix:key2',
      ]);
    });

    it('throws when database is not open', async () => {
      await expect(db.getKeys('prefix:')).rejects.toThrow(
        'Database is not open',
      );
    });
  });

  describe('remove', () => {
    it('removes multiple keys successfully', async () => {
      await db.open(dbName, dbVersion);
      await db.set({ key1: 'value1', key2: 'value2', key3: 'value3' });
      await db.remove(['key1', 'key3']);
      const retrieved = await db.get(['key1', 'key2', 'key3']);
      expect(retrieved).toStrictEqual([undefined, 'value2', undefined]);
    });

    it('throws when database is not open', async () => {
      await expect(db.remove(['key'])).rejects.toThrow('Database is not open');
    });
  });

  describe('reset', () => {
    it('clears all stored values', async () => {
      await db.open(dbName, dbVersion);
      await db.set({ key1: 'value1', key2: 'value2' });
      await db.reset();
      expect(await db.get(['key1', 'key2'])).toStrictEqual([
        undefined,
        undefined,
      ]);
    });

    it('throws when database is not open', async () => {
      await expect(db.reset()).rejects.toThrow('Database is not open');
    });
  });

  describe('readwrite durability', () => {
    const STRICT_READWRITE = ['store', 'readwrite', { durability: 'strict' }];
    const DEFAULT_READWRITE = ['store', 'readwrite'];

    it('requests strict durability for set, remove, and reset when enabled', async () => {
      db = new IndexedDBStore({ strictDurability: true });
      await db.open(dbName, dbVersion);
      const transactionSpy = jest.spyOn(IDBDatabase.prototype, 'transaction');

      await db.set({ key: 'value' });
      expect(transactionSpy).toHaveBeenCalledTimes(1);
      expect(transactionSpy.mock.calls[0]).toStrictEqual(STRICT_READWRITE);

      transactionSpy.mockClear();
      await db.remove(['key']);
      expect(transactionSpy).toHaveBeenCalledTimes(1);
      expect(transactionSpy.mock.calls[0]).toStrictEqual(STRICT_READWRITE);

      transactionSpy.mockClear();
      await db.reset();
      expect(transactionSpy).toHaveBeenCalledTimes(1);
      expect(transactionSpy.mock.calls[0]).toStrictEqual(STRICT_READWRITE);
    });

    it('does not request durability for set, remove, and reset by default', async () => {
      await db.open(dbName, dbVersion);
      const transactionSpy = jest.spyOn(IDBDatabase.prototype, 'transaction');

      await db.set({ key: 'value' });
      expect(transactionSpy).toHaveBeenCalledTimes(1);
      expect(transactionSpy.mock.calls[0]).toStrictEqual(DEFAULT_READWRITE);

      transactionSpy.mockClear();
      await db.remove(['key']);
      expect(transactionSpy).toHaveBeenCalledTimes(1);
      expect(transactionSpy.mock.calls[0]).toStrictEqual(DEFAULT_READWRITE);

      transactionSpy.mockClear();
      await db.reset();
      expect(transactionSpy).toHaveBeenCalledTimes(1);
      expect(transactionSpy.mock.calls[0]).toStrictEqual(DEFAULT_READWRITE);
    });

    it('does not request durability for readonly transactions', async () => {
      db = new IndexedDBStore({ strictDurability: true });
      await db.open(dbName, dbVersion);
      await db.set({ 'prefix:key': 'value' });
      const transactionSpy = jest.spyOn(IDBDatabase.prototype, 'transaction');

      await db.get(['prefix:key']);
      expect(transactionSpy).toHaveBeenCalledTimes(1);
      expect(transactionSpy.mock.calls[0]).toStrictEqual(['store', 'readonly']);

      transactionSpy.mockClear();
      await db.getKeys('prefix:');
      expect(transactionSpy).toHaveBeenCalledTimes(1);
      expect(transactionSpy.mock.calls[0]).toStrictEqual(['store', 'readonly']);
    });

    it('writes succeed even though fake-indexeddb ignores the durability option', async () => {
      // All tests in this file run against `fake-indexeddb` (imported at the
      // top). Its `transaction(storeNames, mode)` signature only accepts two
      // arguments and silently drops the third `{ durability }` options bag.
      // This makes it a real stand-in for an engine that does not support the
      // durability option: the extra argument is ignored (not rejected), and
      // the write must still land.
      db = new IndexedDBStore({ strictDurability: true });
      await db.open(dbName, dbVersion);

      await db.set({ key: 'value' });
      expect(await db.get(['key'])).toStrictEqual(['value']);

      await db.remove(['key']);
      expect(await db.get(['key'])).toStrictEqual([undefined]);
    });

    it('rejects when the transaction aborts while committing', async () => {
      db = new IndexedDBStore({ strictDurability: true });
      await db.open(dbName, dbVersion);

      const realTransaction = IDBDatabase.prototype.transaction;
      jest
        .spyOn(IDBDatabase.prototype, 'transaction')
        .mockImplementation(function (this: IDBDatabase, ...args) {
          const tx = realTransaction.apply(this, args);
          const realObjectStore = tx.objectStore.bind(tx);
          tx.objectStore = (name: string) => {
            const store = realObjectStore(name);
            const realPut = store.put.bind(store);
            store.put = (value: unknown, key: IDBValidKey) => {
              const request = realPut(value, key);
              // Abort only once the request has succeeded, so that the request
              // has already left the transaction's request list and no `error`
              // event is fired - which is what a failed commit looks like.
              request.addEventListener('success', () => tx.abort());
              return request;
            };
            return store;
          };
          return tx;
        });

      await expect(db.set({ key: 'value' })).rejects.toThrow(
        'IndexedDB transaction aborted',
      );
    });

    it('rejects when opening the transaction throws', async () => {
      await db.open(dbName, dbVersion);
      jest
        .spyOn(IDBDatabase.prototype, 'transaction')
        .mockImplementation(() => {
          throw new Error('transaction failed');
        });

      await expect(db.set({ key: 'value' })).rejects.toThrow(
        'transaction failed',
      );
    });
  });
});
