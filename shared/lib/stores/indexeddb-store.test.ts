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

  describe('onForcedClose', () => {
    it('is invoked with "versionchange" when the connection receives a versionchange (e.g. shutdown/upgrade)', async () => {
      await db.open(dbName, dbVersion);
      const onForcedClose = jest.fn();
      db.onForcedClose = onForcedClose;

      // Opening a newer version from another connection fires `versionchange`
      // on our open connection. We close in response, which also fires `onclose`.
      await new Promise<void>((resolve, reject) => {
        const req = indexedDB.open(dbName, dbVersion + 1);
        req.onsuccess = () => {
          req.result.close();
          resolve();
        };
        req.onerror = () => reject(req.error);
      });

      expect(onForcedClose).toHaveBeenCalledWith('versionchange');
    });

    it('is invoked with "close" when the connection receives a close event (e.g. browser shutdown)', async () => {
      const openSpy = jest.spyOn(indexedDB, 'open');
      await db.open(dbName, dbVersion);
      const onForcedClose = jest.fn();
      db.onForcedClose = onForcedClose;

      // Simulate the browser firing `close` on our live connection (as happens
      // during shutdown) by invoking the handler wired in `open`.
      const request = openSpy.mock.results[0].value as IDBOpenDBRequest;
      request.result.onclose?.(new Event('close'));

      expect(onForcedClose).toHaveBeenCalledWith('close');
      openSpy.mockRestore();
    });

    it('clears the closed connection so open can reconnect', async () => {
      await db.open(dbName, dbVersion);
      const onForcedClose = jest.fn();
      db.onForcedClose = onForcedClose;

      await new Promise<void>((resolve, reject) => {
        const req = indexedDB.open(dbName, dbVersion + 1);
        req.onsuccess = () => {
          req.result.close();
          resolve();
        };
        req.onerror = () => reject(req.error);
      });

      expect(onForcedClose).toHaveBeenCalled();
      await expect(db.set({ key: 'value' })).rejects.toThrow(
        'Database is not open',
      );

      const openSpy = jest.spyOn(indexedDB, 'open');
      await db.open(dbName, dbVersion + 1);
      expect(openSpy).toHaveBeenCalled();
      openSpy.mockRestore();

      await db.set({ key: 'value' });
      await expect(db.get(['key'])).resolves.toStrictEqual(['value']);
    });
  });
});
