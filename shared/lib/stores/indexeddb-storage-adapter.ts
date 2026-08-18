import type { Json } from '@metamask/utils';
import type {
  StorageAdapter,
  StorageGetResult,
} from '@metamask/storage-service';
import { STORAGE_KEY_PREFIX } from '@metamask/storage-service';
import { getPlatform } from '../../../app/scripts/lib/util';
import { PLATFORM_FIREFOX } from '../../constants/app';
import { BrowserStorageAdapter } from './browser-storage-adapter';
import {
  STORAGE_SERVICE_INDEXED_DB_NAME,
  STORAGE_SERVICE_INDEXED_DB_VERSION,
} from './indexeddb-storage-constants';
import {
  IndexedDBStore,
  isIndexedDBMutationBlockedError,
} from './indexeddb-store';

const isFirefox = getPlatform() === PLATFORM_FIREFOX;

type StorageDatabase = Pick<
  IndexedDBStore,
  'get' | 'getKeys' | 'open' | 'remove' | 'set'
>;

type IndexedDBStorageAdapterOptions = {
  database?: StorageDatabase;
  fallbackStorage?: StorageAdapter;
};

/**
 * Extension StorageService adapter backed by IndexedDB.
 *
 * Falls back to browser.storage.local if IndexedDB is unavailable, as can
 * happen in Firefox private browsing mode.
 */
export class IndexedDBStorageAdapter implements StorageAdapter {
  readonly #database: StorageDatabase;

  readonly #fallbackStorage: StorageAdapter;

  #openPromise?: Promise<boolean>;

  constructor({
    database = new IndexedDBStore(),
    fallbackStorage = new BrowserStorageAdapter(),
  }: IndexedDBStorageAdapterOptions = {}) {
    this.#database = database;
    this.#fallbackStorage = fallbackStorage;
  }

  #makeKey(namespace: string, key: string): string {
    return `${STORAGE_KEY_PREFIX}${namespace}:${key}`;
  }

  async #selectStorage(): Promise<boolean> {
    try {
      await this.#database.open(
        STORAGE_SERVICE_INDEXED_DB_NAME,
        STORAGE_SERVICE_INDEXED_DB_VERSION,
      );

      return true;
    } catch (error) {
      if (!isIndexedDBMutationBlockedError(error)) {
        throw error;
      }

      console.warn(
        'StorageService: IndexedDB is unavailable; falling back to browser.storage.local.',
      );

      return false;
    }
  }

  async #canUseIndexedDB(): Promise<boolean> {
    // Chrome has an issue with its `storage.local` implementation -- it doesn't
    // like sharing the database with "large" keys, like Snaps source code.
    // Firefox doesn't have any issues with storage stability in storage.local,
    // but users are able to turn `indexedDB` completely _off_ in Firefox. We
    // can reasonably fall back to storage.local in such cases, since we'd be
    // missing data that once existed... and to make things more complicated,
    // if a user turns `indexedDB` back on later, the old "missing" data comes
    // back like it was never missing in the first place.
    // So, on FireFox, we report `indexedDb` as unavailable.
    if (isFirefox) {
      return false;
    }

    if (!this.#openPromise) {
      this.#openPromise = this.#selectStorage().catch((error) => {
        this.#openPromise = undefined;
        throw error;
      });
    }

    return this.#openPromise;
  }

  /**
   * Retrieve an item from the selected storage backend.
   * @param namespace
   * @param key
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
   * Store an item in the selected storage backend.
   * @param namespace
   * @param key
   * @param value
   */
  async setItem(namespace: string, key: string, value: Json): Promise<void> {
    if (await this.#canUseIndexedDB()) {
      const fullKey = this.#makeKey(namespace, key);
      await this.#database.set({ [fullKey]: value });
      return;
    }

    await this.#fallbackStorage.setItem(namespace, key, value);
  }

  /**
   * Remove an item from the selected storage backend.
   * @param namespace
   * @param key
   */
  async removeItem(namespace: string, key: string): Promise<void> {
    if (await this.#canUseIndexedDB()) {
      const fullKey = this.#makeKey(namespace, key);
      await this.#database.remove([fullKey]);
      return;
    }

    await this.#fallbackStorage.removeItem(namespace, key);
  }

  /**
   * Get all keys for a namespace from the selected storage backend.
   * @param namespace
   */
  async getAllKeys(namespace: string): Promise<string[]> {
    const prefix = `${STORAGE_KEY_PREFIX}${namespace}:`;

    if (await this.#canUseIndexedDB()) {
      const indexedDbKeys = await this.#database.getKeys(prefix);
      return indexedDbKeys.map((key) => key.slice(prefix.length));
    }

    return this.#fallbackStorage.getAllKeys(namespace);
  }

  /**
   * Clear a namespace in the selected storage backend.
   * @param namespace
   */
  async clear(namespace: string): Promise<void> {
    if (await this.#canUseIndexedDB()) {
      const prefix = `${STORAGE_KEY_PREFIX}${namespace}:`;
      await this.#database.remove(await this.#database.getKeys(prefix));
      return;
    }

    await this.#fallbackStorage.clear(namespace);
  }
}
