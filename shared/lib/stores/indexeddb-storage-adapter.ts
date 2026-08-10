import type { Json } from '@metamask/utils';
import type {
  StorageAdapter,
  StorageGetResult,
} from '@metamask/storage-service';
import { STORAGE_KEY_PREFIX } from '@metamask/storage-service';
import { BrowserStorageAdapter } from './browser-storage-adapter';
import {
  STORAGE_SERVICE_INDEXED_DB_NAME,
  STORAGE_SERVICE_INDEXED_DB_VERSION,
} from './indexeddb-storage-constants';
import { IndexedDBStore } from './indexeddb-store';

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
 * Existing StorageService data was previously written to browser.storage.local,
 * so this adapter promotes legacy values to IndexedDB when they are read. The
 * legacy copy is retained and new values are written to both stores during the
 * canary rollout so disabling the feature flag or rolling back remains safe.
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

  readonly #synchronizedKeys = new Set<string>();

  #useFallbackStorageOnly = false;

  #switchToFallbackStorage(): void {
    if (this.#useFallbackStorageOnly) {
      return;
    }

    this.#useFallbackStorageOnly = true;
    console.warn(
      'StorageService: IndexedDB is unavailable; falling back to browser.storage.local.',
    );
  }

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
            this.#switchToFallbackStorage();
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
      const fullKey = this.#makeKey(namespace, key);
      const canUseIndexedDB = await this.#canUseIndexedDB();
      let fallbackResult: StorageGetResult | undefined;

      // storage.local is authoritative on the first access after each
      // background start. It may have changed while the rollout flag was
      // disabled, so synchronize it before trusting an older IndexedDB value.
      if (canUseIndexedDB && !this.#synchronizedKeys.has(fullKey)) {
        fallbackResult = await this.#fallbackStorage.getItem(namespace, key);

        if (fallbackResult.error) {
          return fallbackResult;
        }

        if (fallbackResult.result !== undefined) {
          try {
            await this.#database.set({ [fullKey]: fallbackResult.result });
            this.#synchronizedKeys.add(fullKey);
          } catch (error) {
            if (isIndexedDBMutationBlockedError(error)) {
              this.#switchToFallbackStorage();
            } else {
              console.warn(
                `StorageService: Failed to promote legacy item to IndexedDB: ${namespace}:${key}`,
                error,
              );
            }
          }

          return fallbackResult;
        }

        // If the rollout flag was disabled, the legacy adapter may have
        // removed this key while an older IndexedDB value remained. Treat an
        // absent legacy value as authoritative during the rollback-safe
        // canary phase so re-enabling the flag cannot resurrect stale data.
        try {
          await this.#database.remove([fullKey]);
          this.#synchronizedKeys.add(fullKey);
        } catch (error) {
          if (isIndexedDBMutationBlockedError(error)) {
            this.#switchToFallbackStorage();
          } else {
            console.warn(
              `StorageService: Failed to remove stale IndexedDB item: ${namespace}:${key}`,
              error,
            );
          }
        }

        return fallbackResult;
      }

      if (canUseIndexedDB && !this.#useFallbackStorageOnly) {
        try {
          const [value] = await this.#database.get([fullKey]);
          if (value !== undefined) {
            return { result: value as Json };
          }
        } catch (error) {
          if (!isIndexedDBMutationBlockedError(error)) {
            throw error;
          }

          this.#switchToFallbackStorage();
        }
      }

      return (
        fallbackResult ??
        (await this.#fallbackStorage.getItem(namespace, key))
      );
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
      const fullKey = this.#makeKey(namespace, key);
      this.#synchronizedKeys.delete(fullKey);

      // Keep browser.storage.local current throughout the canary rollout so
      // disabling the flag or rolling back can safely use the legacy adapter.
      // Write it first so an interrupted background process cannot leave the
      // rollback store older than IndexedDB.
      await this.#fallbackStorage.setItem(namespace, key, value);

      if (await this.#canUseIndexedDB()) {
        try {
          await this.#database.set({ [fullKey]: value });
          this.#synchronizedKeys.add(fullKey);
        } catch (error) {
          if (!isIndexedDBMutationBlockedError(error)) {
            throw error;
          }

          this.#switchToFallbackStorage();
        }
      }
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
      const fullKey = this.#makeKey(namespace, key);
      this.#synchronizedKeys.delete(fullKey);
      await this.#fallbackStorage.removeItem(namespace, key);

      if (await this.#canUseIndexedDB()) {
        try {
          await this.#database.remove([fullKey]);
          this.#synchronizedKeys.add(fullKey);
        } catch (error) {
          if (!isIndexedDBMutationBlockedError(error)) {
            throw error;
          }

          this.#switchToFallbackStorage();
        }
      }
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
      const prefix = `${STORAGE_KEY_PREFIX}${namespace}:`;
      const fallbackKeys = await this.#fallbackStorage.getAllKeys(namespace);

      if (await this.#canUseIndexedDB()) {
        const indexedDbKeys = await this.#database.getKeys(prefix);
        const fallbackFullKeys = new Set(
          fallbackKeys.map((key) => `${prefix}${key}`),
        );
        const staleIndexedDbKeys = indexedDbKeys.filter(
          (key) => !fallbackFullKeys.has(key),
        );

        if (staleIndexedDbKeys.length > 0) {
          try {
            await this.#database.remove(staleIndexedDbKeys);
          } catch (error) {
            if (!isIndexedDBMutationBlockedError(error)) {
              throw error;
            }

            this.#switchToFallbackStorage();
          }
        }
      }

      return fallbackKeys;
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
      const prefix = `${STORAGE_KEY_PREFIX}${namespace}:`;
      for (const key of this.#synchronizedKeys) {
        if (key.startsWith(prefix)) {
          this.#synchronizedKeys.delete(key);
        }
      }

      await this.#fallbackStorage.clear(namespace);

      if (await this.#canUseIndexedDB()) {
        try {
          await this.#database.remove(await this.#database.getKeys(prefix));
        } catch (error) {
          if (!isIndexedDBMutationBlockedError(error)) {
            throw error;
          }

          this.#switchToFallbackStorage();
        }
      }
    } catch (error) {
      console.error(
        `StorageService: Failed to clear namespace ${namespace}`,
        error,
      );
      throw error;
    }
  }
}
