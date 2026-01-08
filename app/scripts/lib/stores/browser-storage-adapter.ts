import browser from 'webextension-polyfill';
import type { Json } from '@metamask/utils';
import type {
  StorageAdapter,
  StorageGetResult,
} from '@metamask/storage-service';
import { STORAGE_KEY_PREFIX } from '@metamask/storage-service';

/**
 * Extension-specific storage adapter using browser.storage.local.
 *
 * Keys are formatted as: storageService:{namespace}:{key}
 * Example: storageService:TokenListController:tokensChainsCache
 */
export class BrowserStorageAdapter implements StorageAdapter {
  /**
   * Build the full storage key.
   *
   * @param namespace - Controller namespace
   * @param key - Data key
   * @returns Full key: storageService:{namespace}:{key}
   */
  #makeKey(namespace: string, key: string): string {
    return `${STORAGE_KEY_PREFIX}${namespace}:${key}`;
  }

  /**
   * Retrieve an item from browser.storage.local.
   *
   * @param namespace - Controller namespace
   * @param key - Data key
   * @returns StorageGetResult: { result } if found, {} if not found, { error } on failure
   */
  async getItem(namespace: string, key: string): Promise<StorageGetResult> {
    try {
      const fullKey = this.#makeKey(namespace, key);
      const result = await browser.storage.local.get(fullKey);

      // Key not found
      if (!(fullKey in result)) {
        return {};
      }

      return { result: result[fullKey] as Json };
    } catch (error) {
      console.error(
        `StorageService: Failed to get item: ${namespace}:${key}`,
        error,
      );
      return { error: error as Error };
    }
  }

  /**
   * Store an item in browser.storage.local.
   * browser.storage.local auto-serializes JSON, so we store directly.
   *
   * @param namespace - Controller namespace
   * @param key - Data key
   * @param value - JSON value to store
   */
  async setItem(namespace: string, key: string, value: Json): Promise<void> {
    try {
      const fullKey = this.#makeKey(namespace, key);
      await browser.storage.local.set({ [fullKey]: value });
    } catch (error) {
      console.error(
        `StorageService: Failed to set item: ${namespace}:${key}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Remove an item from browser.storage.local.
   *
   * @param namespace - Controller namespace
   * @param key - Data key
   */
  async removeItem(namespace: string, key: string): Promise<void> {
    try {
      const fullKey = this.#makeKey(namespace, key);
      await browser.storage.local.remove(fullKey);
    } catch (error) {
      console.error(
        `StorageService: Failed to remove item: ${namespace}:${key}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get all keys for a namespace.
   * Filters by prefix and strips prefix from returned keys.
   *
   * @param namespace - Controller namespace
   * @returns Array of keys without prefix
   */
  async getAllKeys(namespace: string): Promise<string[]> {
    try {
      const prefix = `${STORAGE_KEY_PREFIX}${namespace}:`;
      const all = await browser.storage.local.get(null);

      return Object.keys(all)
        .filter((k) => k.startsWith(prefix))
        .map((k) => k.slice(prefix.length));
    } catch (error) {
      console.error(
        `StorageService: Failed to get keys for ${namespace}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Clear all items for a namespace.
   *
   * @param namespace - Controller namespace
   */
  async clear(namespace: string): Promise<void> {
    try {
      const keys = await this.getAllKeys(namespace);
      const fullKeys = keys.map((k) => this.#makeKey(namespace, k));

      if (fullKeys.length > 0) {
        await browser.storage.local.remove(fullKeys);
      }

      console.log(
        `StorageService: Cleared ${fullKeys.length} keys for ${namespace}`,
      );
    } catch (error) {
      console.error(
        `StorageService: Failed to clear namespace ${namespace}`,
        error,
      );
      throw error;
    }
  }
}

/**
 * Singleton instance of the browser storage adapter.
 */
export const browserStorageAdapter = new BrowserStorageAdapter();
