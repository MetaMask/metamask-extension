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
   * Retrieve an item from indexedDB
   *
   * @param namespace - Controller namespace
   * @param key - Data key
   * @returns StorageGetResult: { result } if found, {} if not found, { error } on failure
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
   * Store an item in indexedDB.
   *
   * @param namespace - Controller namespace
   * @param key - Data key
   * @param value - JSON value to store
   */
  async setItem(namespace: string, key: string, value: Json): Promise<void> {
    try {
      await this.#open();
      const fullKey = this.#makeKey(namespace, key);
      await this.#database.set({ [fullKey]: value });
    } catch (error) {
      console.error(
        `StorageService: Failed to set item: ${namespace}:${key}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Remove an item from indexedDB.
   *
   * @param namespace - Controller namespace
   * @param key - Data key
   */
  async removeItem(namespace: string, key: string): Promise<void> {
    try {
      await this.#open();
      const fullKey = this.#makeKey(namespace, key);
      await this.#database.remove([fullKey]);
    } catch (error) {
      console.error(
        `StorageService: Failed to remove item: ${namespace}:${key}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get all keys for a namespace from indexedDB.
   *
   * @param namespace - Controller namespace
   * @returns Array of keys without prefix
   */
  async getAllKeys(namespace: string): Promise<string[]> {
    try {
      const prefix = `${STORAGE_KEY_PREFIX}${namespace}:`;

      await this.#open();
      const indexedDbKeys = await this.#database.getKeys(prefix);
      return indexedDbKeys.map((key) => key.slice(prefix.length));
    } catch (error) {
      console.error(
        `StorageService: Failed to get keys for ${namespace}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Clear a namespace in indexedDB.
   *
   * @param namespace - Controller namespace
   */
  async clear(namespace: string): Promise<void> {
    try {
      await this.#open();
      const prefix = `${STORAGE_KEY_PREFIX}${namespace}:`;
      await this.#database.remove(await this.#database.getKeys(prefix));
    } catch (error) {
      console.error(
        `StorageService: Failed to clear namespace ${namespace}`,
        error,
      );
      throw error;
    }
  }
}
