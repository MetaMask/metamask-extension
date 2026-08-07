import type { Json } from '@metamask/utils';
import type {
  StorageAdapter,
  StorageGetResult,
} from '@metamask/storage-service';
import { STORAGE_KEY_PREFIX } from '@metamask/storage-service';
import { BrowserStorageAdapter } from './browser-storage-adapter';
import { IndexedDBStore } from './indexeddb-store';

export const STORAGE_SERVICE_INDEXED_DB_NAME = 'metamask-storage-service';
export const STORAGE_SERVICE_INDEXED_DB_VERSION = 1;

const FIREFOX_INDEXED_DB_MUTATION_BLOCKED_ERROR =
  'A mutation operation was attempted on a database that did not allow mutations.';

type IndexedDBStorageAdapterOptions = {
  database?: Pick<
    IndexedDBStore,
    'get' | 'getKeys' | 'open' | 'remove' | 'set'
  >;
  databaseName?: string;
  databaseVersion?: number;
  fallbackStorage?: StorageAdapter;
};

/**
 * Checks if the browser blocked IndexedDB mutations, which can happen in
 * Firefox private browsing mode.
 *
 * @param error - The error thrown by IndexedDB.
 * @returns True if IndexedDB is unavailable because mutations are blocked.
 */
export function isIndexedDBMutationBlockedError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    error.name === 'InvalidStateError' &&
    error.message === FIREFOX_INDEXED_DB_MUTATION_BLOCKED_ERROR
  );
}

/**
 * Extension StorageService adapter backed by IndexedDB.
 *
 * Existing storageService data was previously written to browser.storage.local,
 * so this adapter also reads and removes from that legacy storage as a fallback.
 */
export class IndexedDBStorageAdapter implements StorageAdapter {
  readonly #database: Pick<
    IndexedDBStore,
    'get' | 'getKeys' | 'open' | 'remove' | 'set'
  >;

  readonly #databaseName: string;

  readonly #databaseVersion: number;

  readonly #fallbackStorage: StorageAdapter;

  #openPromise?: Promise<boolean>;

  #useFallbackStorageOnly = false;

  constructor({
    database = new IndexedDBStore(),
    databaseName = STORAGE_SERVICE_INDEXED_DB_NAME,
    databaseVersion = STORAGE_SERVICE_INDEXED_DB_VERSION,
    fallbackStorage = new BrowserStorageAdapter(),
  }: IndexedDBStorageAdapterOptions = {}) {
    this.#database = database;
    this.#databaseName = databaseName;
    this.#databaseVersion = databaseVersion;
    this.#fallbackStorage = fallbackStorage;
  }

  /**
   * Build the full storage key.
   *
   * @param namespace - Controller namespace.
   * @param key - Data key.
   * @returns Full key: storageService:{namespace}:{key}
   */
  #makeKey(namespace: string, key: string): string {
    return `${STORAGE_KEY_PREFIX}${namespace}:${key}`;
  }

  async #canUseIndexedDB(): Promise<boolean> {
    if (this.#useFallbackStorageOnly) {
      return false;
    }

    if (!this.#openPromise) {
      this.#openPromise = this.#database
        .open(this.#databaseName, this.#databaseVersion)
        .then(() => true)
        .catch((error) => {
          if (isIndexedDBMutationBlockedError(error)) {
            this.#useFallbackStorageOnly = true;
            console.warn(
              'StorageService: IndexedDB is unavailable; falling back to browser.storage.local.',
            );
            return false;
          }

          this.#openPromise = undefined;
          throw error;
        });
    }

    return await this.#openPromise;
  }

  /**
   * Retrieve an item from IndexedDB, falling back to browser.storage.local for
   * legacy storageService data.
   *
   * @param namespace - Controller namespace.
   * @param key - Data key.
   * @returns StorageGetResult: { result } if found, {} if not found, { error } on failure.
   */
  async getItem(namespace: string, key: string): Promise<StorageGetResult> {
    try {
      if (await this.#canUseIndexedDB()) {
        const fullKey = this.#makeKey(namespace, key);
        const [value] = await this.#database.get([fullKey]);
        if (value !== undefined) {
          return { result: value as Json };
        }
      }

      return await this.#fallbackStorage.getItem(namespace, key);
    } catch (error) {
      console.error(
        `StorageService: Failed to get item: ${namespace}:${key}`,
        error,
      );
      return { error: error as Error };
    }
  }

  /**
   * Store an item in IndexedDB, falling back to browser.storage.local if
   * IndexedDB mutations are blocked.
   *
   * @param namespace - Controller namespace.
   * @param key - Data key.
   * @param value - JSON value to store.
   */
  async setItem(namespace: string, key: string, value: Json): Promise<void> {
    try {
      if (await this.#canUseIndexedDB()) {
        const fullKey = this.#makeKey(namespace, key);
        await this.#database.set({ [fullKey]: value });
        return;
      }

      await this.#fallbackStorage.setItem(namespace, key, value);
    } catch (error) {
      console.error(
        `StorageService: Failed to set item: ${namespace}:${key}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Remove an item from IndexedDB and legacy browser.storage.local storage.
   *
   * @param namespace - Controller namespace.
   * @param key - Data key.
   */
  async removeItem(namespace: string, key: string): Promise<void> {
    try {
      if (await this.#canUseIndexedDB()) {
        const fullKey = this.#makeKey(namespace, key);
        await this.#database.remove([fullKey]);
      }

      await this.#fallbackStorage.removeItem(namespace, key);
    } catch (error) {
      console.error(
        `StorageService: Failed to remove item: ${namespace}:${key}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get all keys for a namespace from IndexedDB and legacy browser.storage.local
   * storage.
   *
   * @param namespace - The namespace to get keys for.
   * @returns Array of keys without prefix.
   */
  async getAllKeys(namespace: string): Promise<string[]> {
    try {
      const keys = new Set<string>();
      const prefix = `${STORAGE_KEY_PREFIX}${namespace}:`;

      if (await this.#canUseIndexedDB()) {
        const indexedDbKeys = await this.#database.getKeys(prefix);
        indexedDbKeys.forEach((key) => {
          keys.add(key.slice(prefix.length));
        });
      }

      const fallbackKeys = await this.#fallbackStorage.getAllKeys(namespace);
      fallbackKeys.forEach((key) => keys.add(key));

      return [...keys];
    } catch (error) {
      console.error(
        `StorageService: Failed to get keys for ${namespace}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Clear all items for a namespace from IndexedDB and legacy
   * browser.storage.local storage.
   *
   * @param namespace - The namespace to clear.
   */
  async clear(namespace: string): Promise<void> {
    try {
      if (await this.#canUseIndexedDB()) {
        const prefix = `${STORAGE_KEY_PREFIX}${namespace}:`;
        await this.#database.remove(await this.#database.getKeys(prefix));
      }

      await this.#fallbackStorage.clear(namespace);
    } catch (error) {
      console.error(
        `StorageService: Failed to clear namespace ${namespace}`,
        error,
      );
      throw error;
    }
  }
}
