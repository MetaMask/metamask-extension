import type { Json } from '@metamask/utils';
import type {
  StorageAdapter,
  StorageGetResult,
} from '@metamask/storage-service';
import { STORAGE_KEY_PREFIX } from '@metamask/storage-service';
import { BrowserStorageAdapter } from './browser-storage-adapter';
import {
  STORAGE_SERVICE_INDEXED_DB_FALLBACK_KEY,
  STORAGE_SERVICE_INDEXED_DB_FALLBACK_NAMESPACE,
  STORAGE_SERVICE_INDEXED_DB_NAME,
  STORAGE_SERVICE_INDEXED_DB_VERSION,
} from './indexeddb-storage-constants';
import { IndexedDBStore } from './indexeddb-store';

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
  return error instanceof DOMException && error.name === 'InvalidStateError';
}

/**
 * Extension StorageService adapter backed by IndexedDB.
 *
 * Falls back to browser.storage.local if IndexedDB is unavailable, as can
 * happen in Firefox private browsing mode. The fallback choice is persisted so
 * later browser-mode changes cannot silently switch to a different data source.
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

  #switchToFallbackStorage(message: string): void {
    if (!this.#useFallbackStorageOnly) {
      this.#useFallbackStorageOnly = true;
      console.warn(message);
    }
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

  async #selectStorage(): Promise<boolean> {
    const fallbackMarker = await this.#fallbackStorage.getItem(
      STORAGE_SERVICE_INDEXED_DB_FALLBACK_NAMESPACE,
      STORAGE_SERVICE_INDEXED_DB_FALLBACK_KEY,
    );

    if (fallbackMarker.result === true) {
      this.#switchToFallbackStorage(
        'StorageService: Continuing to use browser.storage.local because it contains fallback data.',
      );
      return false;
    }

    if (fallbackMarker.error) {
      throw fallbackMarker.error;
    }

    try {
      await this.#database.open(this.#databaseName, this.#databaseVersion);
      return true;
    } catch (error) {
      if (!isIndexedDBMutationBlockedError(error)) {
        throw error;
      }

      try {
        await this.#fallbackStorage.setItem(
          STORAGE_SERVICE_INDEXED_DB_FALLBACK_NAMESPACE,
          STORAGE_SERVICE_INDEXED_DB_FALLBACK_KEY,
          true,
        );
      } catch (markerError) {
        console.error(
          'StorageService: Failed to persist the browser.storage.local fallback marker.',
          markerError,
        );
        throw markerError;
      }

      this.#switchToFallbackStorage(
        'StorageService: IndexedDB is unavailable; falling back to browser.storage.local.',
      );

      return false;
    }
  }

  async #canUseIndexedDB(): Promise<boolean> {
    if (this.#useFallbackStorageOnly) {
      return false;
    }

    if (!this.#openPromise) {
      this.#openPromise = this.#selectStorage().catch((error) => {
        this.#openPromise = undefined;
        throw error;
      });
    }

    return await this.#openPromise;
  }

  /**
   * Retrieve an item from IndexedDB, or from the fallback adapter when
   * IndexedDB is unavailable.
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
        return value === undefined ? {} : { result: value as Json };
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
   * Store an item in IndexedDB, or in the fallback adapter when IndexedDB is
   * unavailable.
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
   * Remove an item from IndexedDB, or from the fallback adapter when
   * IndexedDB is unavailable.
   *
   * @param namespace - Controller namespace.
   * @param key - Data key.
   */
  async removeItem(namespace: string, key: string): Promise<void> {
    try {
      if (await this.#canUseIndexedDB()) {
        const fullKey = this.#makeKey(namespace, key);
        await this.#database.remove([fullKey]);
        return;
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
   * Get all keys for a namespace from IndexedDB, or from the fallback adapter
   * when IndexedDB is unavailable.
   *
   * @param namespace - The namespace to get keys for.
   * @returns Array of keys without prefix.
   */
  async getAllKeys(namespace: string): Promise<string[]> {
    try {
      const prefix = `${STORAGE_KEY_PREFIX}${namespace}:`;

      if (await this.#canUseIndexedDB()) {
        const indexedDbKeys = await this.#database.getKeys(prefix);
        return indexedDbKeys.map((key) => key.slice(prefix.length));
      }

      return await this.#fallbackStorage.getAllKeys(namespace);
    } catch (error) {
      console.error(
        `StorageService: Failed to get keys for ${namespace}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Clear all items for a namespace from IndexedDB, or from the fallback
   * adapter when IndexedDB is unavailable.
   *
   * @param namespace - The namespace to clear.
   */
  async clear(namespace: string): Promise<void> {
    try {
      if (await this.#canUseIndexedDB()) {
        const prefix = `${STORAGE_KEY_PREFIX}${namespace}:`;
        await this.#database.remove(await this.#database.getKeys(prefix));
        return;
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
