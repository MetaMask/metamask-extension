import localforage from 'localforage';

/**
 * Get an item from the "localforage" (basically a catch-all) IndexedDB store.
 *
 * @param key - The key to store the data under
 * @returns The data stored under the key
 */
export async function getStorageItem<T = any>(
  key: string,
): Promise<T | undefined> {
  try {
    const serializedData = await localforage.getItem<string>(key);
    if (serializedData === null) {
      return undefined;
    }

    return JSON.parse(serializedData);
  } catch (err) {
    return undefined;
  }
}

/**
 * Set an item in the "localforage" (basically a catch-all) IndexedDB store.
 *
 * Warning: errors are completely ignored, the data might not be stored.
 *
 * @param key - The key to store the data under
 * @param value - The value to be stored
 */
export async function setStorageItem(key: string, value: any): Promise<void> {
  try {
    const serializedData = JSON.stringify(value);
    await localforage.setItem(key, serializedData);
  } catch (err) {
    console.warn(err);
  }
}
