import localforage from 'localforage';
import { Cloneable, getDbCacheEntry, setInCaches } from './fetch-with-cache';
export type { Cloneable } from './fetch-with-cache';

export const version = 1;

localforage.config({
  storeName: `storage-helpers-v${version}`,
});

/**
 * Retrieves an item from local storage.
 *
 * @param key - The key of the item to retrieve from storage.
 * @returns The value associated with the key, or undefined if the item does not exist or an error occurs.
 */
export async function getStorageItem<T extends Cloneable>(key: string) {
  try {
    return (await getDbCacheEntry(key)) as T;
  } catch (err) {
    return undefined;
  }
}

/**
 * Stores an item in local storage.
 *
 * @param key - The key to associate with the item.
 * @param value - The item to store.
 * @returns The value that was set in storage, or undefined if an error occurs.
 */
export async function setStorageItem(key: string, value: Cloneable) {
  try {
    return await setInCaches(key, value, 0);
  } catch (err) {
    console.warn(err);
  }
}
