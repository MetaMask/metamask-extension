import log from 'loglevel';
import type {
  BaseStore,
  MetaData,
  MetaMaskStorageStructure,
} from './base-store';
import { IndexedDBStore } from './indexeddb-store';

const DEFAULT_INDEXED_DB_NAME = 'metamask-state';
const DEFAULT_INDEXED_DB_VERSION = 1;

/**
 * BaseStore implementation backed by IndexedDB.
 */
export class IndexedDBPersistenceStore implements BaseStore {
  readonly #db: IndexedDBStore;

  readonly #dbName: string;

  readonly #dbVersion: number;

  #openPromise: Promise<void> | undefined;

  #manifest: Set<string> = new Set();

  constructor({
    db = new IndexedDBStore(),
    dbName = DEFAULT_INDEXED_DB_NAME,
    dbVersion = DEFAULT_INDEXED_DB_VERSION,
  }: {
    db?: IndexedDBStore;
    dbName?: string;
    dbVersion?: number;
  } = {}) {
    this.#db = db;
    this.#dbName = dbName;
    this.#dbVersion = dbVersion;
  }

  async #open(): Promise<void> {
    this.#openPromise ??= this.#db.open(this.#dbName, this.#dbVersion);
    await this.#openPromise;
  }

  async get(): Promise<MetaMaskStorageStructure | null> {
    await this.#open();
    console.time('[IndexedDBPersistenceStore]: Reading from IndexedDB');
    try {
      const [manifest] = await this.#db.get(['manifest']);
      if (Array.isArray(manifest)) {
        const keys = manifest.filter(
          (key): key is string => typeof key === 'string',
        );
        if (keys.length === 0) {
          return {};
        }
        const values = await this.#db.get(keys);
        const data: Record<string, unknown> = {};
        keys.forEach((key, index) => {
          data[key] = values[index];
        });
        this.#manifest = new Set(keys);
        const { meta } = data;
        delete data.meta;
        const storage: MetaMaskStorageStructure = {};
        if (Object.keys(data).length > 0) {
          storage.data = data;
        }
        if (meta !== undefined) {
          storage.meta = meta as unknown as MetaData;
        }
        return storage;
      }

      const [data, meta] = await this.#db.get(['data', 'meta']);
      const storage: MetaMaskStorageStructure = {};
      if (data !== undefined) {
        storage.data = data as MetaMaskStorageStructure['data'];
        this.#manifest.add('data');
      }
      if (meta !== undefined) {
        storage.meta = meta as MetaData;
        this.#manifest.add('meta');
      }
      return storage;
    } finally {
      console.timeEnd('[IndexedDBPersistenceStore]: Reading from IndexedDB');
    }
  }

  async setKeyValues(pairs: Map<string, unknown>): Promise<void> {
    await this.#open();

    const toSet: Record<string, unknown> = Object.create(null);
    const toRemove: string[] = [];
    const changeOps: { op: 'add' | 'delete'; key: string }[] = [];

    for (const [key, value] of pairs) {
      const keyExists = this.#manifest.has(key);
      const isRemoving = typeof value === 'undefined';
      if (isRemoving) {
        if (!keyExists) {
          log.warn(
            '[IndexedDBPersistenceStore]: Trying to remove a key that does not exist in manifest:',
            key,
          );
          continue;
        }
        changeOps.push({ op: 'delete', key });
        toRemove.push(key);
        continue;
      }

      if (!keyExists) {
        changeOps.push({ op: 'add', key });
      }
      toSet[key] = value;
    }

    const updateManifest = changeOps.length > 0;
    let newManifest: Set<string> | undefined;
    if (updateManifest) {
      newManifest = new Set(this.#manifest);
      for (const { op, key } of changeOps) {
        newManifest[op](key);
      }
      toSet.manifest = Array.from(newManifest);
    }

    console.time('[IndexedDBPersistenceStore]: Writing to IndexedDB');
    try {
      await this.#db.set(toSet);
      if (newManifest) {
        this.#manifest = newManifest;
      }
      await this.#db.remove(toRemove);
    } finally {
      console.timeEnd('[IndexedDBPersistenceStore]: Writing to IndexedDB');
    }
  }

  async set({ data, meta }: Required<MetaMaskStorageStructure>): Promise<void> {
    await this.#open();

    console.time('[IndexedDBPersistenceStore]: Overwriting IndexedDB');
    try {
      await this.#db.set({ data, meta });
      this.#manifest.add('data');
      this.#manifest.add('meta');
    } finally {
      console.timeEnd('[IndexedDBPersistenceStore]: Overwriting IndexedDB');
    }
  }

  async reset(): Promise<void> {
    await this.#open();
    await this.#db.reset();
    this.#manifest.clear();
  }

  close(): void {
    this.#db.close();
    this.#openPromise = undefined;
    this.#manifest.clear();
  }
}
