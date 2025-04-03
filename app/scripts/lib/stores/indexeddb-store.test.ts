import 'fake-indexeddb/auto';
import { DB } from './indexeddb-store'; // Adjust the import path to your file

describe('IndexedDBStore', () => {
  const dbName = 'test-db';
  const dbVersion = 1;
  let db: DB;

  // Ensure a clean state before each test by deleting the database
  beforeEach(async () => {
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase(dbName);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  });
  beforeEach(() => {
    db = new DB();
  });
  afterEach(() => {
    db.close();
  });

  describe('open', () => {
    it('opens the database successfully and creates store on first open', async () => {
      await db.open(dbName, dbVersion);
      // Verify the database is open by performing an operation
      await db.set({ key: 'value' });
      const values = await db.get(['key']);
      expect(values).toEqual(['value']);
    });

    it('rejects with TypeError for invalid version (0)', async () => {
      await expect(db.open(dbName, 0)).rejects.toThrow(TypeError);
    });

    it('handles opening errors', async () => {
      await db.open(dbName, dbVersion + 1);
      db.close();
      db = new DB();
      // trigger a "VersionError" by trying to open the database with a
      // an _earlier_ different version number
      await expect(db.open(dbName, dbVersion)).rejects.toThrow(Error);
    });

    it('handles database version upgrades', async () => {
      await db.open(dbName, dbVersion);
      await db.set({ key: 'value' });
      db.close();
      db = new DB();
      await db.open(dbName, dbVersion + 1);
      const [value] = await db.get(['key']);
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
      expect(retrieved).toEqual(['value1', 42, { nested: true }]);
    });

    it('throws  when database is not open', async () => {
      await expect(db.set({ key: 'value' })).rejects.toThrow(
        'Database is not open',
      );
    });

    it('rejects on transaction error with non-serializable value', async () => {
      await db.open(dbName, dbVersion);
      const values = {
        key: () => {
          return undefined;
        },
      }; // Functions are not serializable
      await expect(db.set(values)).rejects.toThrow(
        'The data being stored could not be cloned by the internal structured cloning algorithm.',
      );
    });
  });

  describe('get', () => {
    it('gets multiple keys, preserving order and duplicates, with undefined for missing keys', async () => {
      await db.open(dbName, dbVersion);
      await db.set({ key1: 'value1', key2: 'value2' });
      const retrieved = await db.get(['key1', 'key3', 'key2', 'key1']);
      expect(retrieved).toEqual(['value1', undefined, 'value2', 'value1']);
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
      expect(retrieved).toEqual([undefined, 'value2', undefined]);
    });

    it('throws when database is not open', async () => {
      await expect(db.remove(['key'])).rejects.toThrow('Database is not open');
    });
  });
});
