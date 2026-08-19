import type { Json } from '@metamask/utils';
import type {
  StorageAdapter,
  StorageGetResult,
} from '@metamask/storage-service';
import { STORAGE_KEY_PREFIX } from '@metamask/storage-service';
import {
  STORAGE_SERVICE_INDEXED_DB_NAME,
  STORAGE_SERVICE_INDEXED_DB_VERSION,
} from './indexeddb-storage-constants';
import { IndexedDBStore } from './indexeddb-store';

type StorageDatabase = Pick<
  IndexedDBStore,
  'get' | 'getKeys' | 'open' | 'remove' | 'set'
>;

type IndexedDBStorageAdapterOptions = {
  database?: StorageDatabase;
};

/**
 * Extension StorageService adapter backed by IndexedDB.
 *
 * Falls back to browser.storage.local if IndexedDB is unavailable, as can
 * happen in Firefox private browsing mode.
 */
export class IndexedDBStorageAdapter implements StorageAdapter {
  readonly #database: StorageDatabase;

  #openPromise?: Promise<void>;

  constructor({
    database = new IndexedDBStore(),
  }: IndexedDBStorageAdapterOptions = {}) {
    this.#database = database;
  }

  #makeKey(namespace: string, key: string): string {
    return `${STORAGE_KEY_PREFIX}${namespace}:${key}`;
  }

  async #open(): Promise<void> {
    if (!this.#openPromise) {
      this.#openPromise = this.#database
        .open(
          STORAGE_SERVICE_INDEXED_DB_NAME,
          STORAGE_SERVICE_INDEXED_DB_VERSION,
        )
        .catch((e) => {
          // resetting the `openPromise` after a failure allows for retries
          // if external callers ever want to retry the operation.
          this.#openPromise = undefined;
          throw e;
        });
    }

    return this.#openPromise;
  }

  /**
   * Retrieve an item from the selected storage backend.
   *
   * @param namespace The namespace of the item.
   * @param key The key of the item.
   */
  async getItem(namespace: string, key: string): Promise<StorageGetResult> {
    try {
      await this.#open();
      const fullKey = this.#makeKey(namespace, key);
      const [value] = await this.#database.get([fullKey]);
      return value === undefined ? {} : { result: value as Json };
    } catch (error) {
      console.error(
        `StorageService: Failed to get item: ${namespace}:${key}`,
        error,
      );
      return { error: error as Error };
    }
  }

  /**
   * Store an item in the selected storage backend.
   *
   * @param namespace The namespace of the item.
   * @param key The key of the item.
   * @param value The value to store.
   */
  async setItem(namespace: string, key: string, value: Json): Promise<void> {
    await this.#open();
    const fullKey = this.#makeKey(namespace, key);
    await this.#database.set({ [fullKey]: value });
  }

  /**
   * Remove an item from the selected storage backend.
   *
   * @param namespace The namespace of the item.
   * @param key The key of the item.
   */
  async removeItem(namespace: string, key: string): Promise<void> {
    await this.#open();
    const fullKey = this.#makeKey(namespace, key);
    await this.#database.remove([fullKey]);
  }

  /**
   * Get all keys for a namespace from the selected storage backend.
   *
   * @param namespace The namespace of the items.
   */
  async getAllKeys(namespace: string): Promise<string[]> {
    const prefix = `${STORAGE_KEY_PREFIX}${namespace}:`;

    await this.#open();
    const indexedDbKeys = await this.#database.getKeys(prefix);
    return indexedDbKeys.map((key) => key.slice(prefix.length));
  }

  /**
   * Clear a namespace in the selected storage backend.
   *
   * @param namespace The namespace of the items.
   */
  async clear(namespace: string): Promise<void> {
    await this.#open();
    const prefix = `${STORAGE_KEY_PREFIX}${namespace}:`;
    await this.#database.remove(await this.#database.getKeys(prefix));
  }
}
