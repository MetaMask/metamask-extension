import 'fake-indexeddb/auto';
import { IndexedDBPersistenceStore } from './indexeddb-persistence-store';

describe('IndexedDBPersistenceStore', () => {
  const dbName = 'test-metamask-state';
  let store: IndexedDBPersistenceStore;

  async function deleteDatabase() {
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase(dbName);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error('deleteDatabase blocked'));
    });
  }

  beforeEach(async () => {
    await deleteDatabase();
    store = new IndexedDBPersistenceStore({ dbName });
  });

  afterEach(async () => {
    store.close();
    await deleteDatabase();
  });

  it('stores and retrieves full data state', async () => {
    await store.set({
      data: { FooController: { value: 'foo' } },
      meta: { version: 1 },
    });

    /* eslint-disable-next-line jest/prefer-strict-equal -- IndexedDB structuredClone can change object prototypes */
    expect(await store.get()).toEqual({
      data: { FooController: { value: 'foo' } },
      meta: { version: 1 },
    });
  });

  it('stores and retrieves split state from manifest keys', async () => {
    await store.setKeyValues(
      new Map<string, unknown>([
        ['FooController', { value: 'foo' }],
        ['meta', { version: 1, storageKind: 'split' }],
      ]),
    );

    /* eslint-disable-next-line jest/prefer-strict-equal -- IndexedDB structuredClone can change object prototypes */
    expect(await store.get()).toEqual({
      data: { FooController: { value: 'foo' } },
      meta: { version: 1, storageKind: 'split' },
    });
  });

  it('removes split state keys and updates the manifest', async () => {
    await store.setKeyValues(
      new Map<string, unknown>([
        ['FooController', { value: 'foo' }],
        ['BarController', { value: 'bar' }],
        ['meta', { version: 1, storageKind: 'split' }],
      ]),
    );

    await store.setKeyValues(
      new Map<string, unknown>([['BarController', undefined]]),
    );

    /* eslint-disable-next-line jest/prefer-strict-equal -- IndexedDB structuredClone can change object prototypes */
    expect(await store.get()).toEqual({
      data: { FooController: { value: 'foo' } },
      meta: { version: 1, storageKind: 'split' },
    });
  });

  it('clears IndexedDB state on reset', async () => {
    await store.set({
      data: { FooController: { value: 'foo' } },
      meta: { version: 1 },
    });

    await store.reset();

    expect(await store.get()).toStrictEqual({});
  });
});
