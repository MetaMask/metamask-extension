import localforage from 'localforage';

export async function getStorageItem<TValue>(
  key: string,
): Promise<TValue | undefined> {
  try {
    const serializedData = await localforage.getItem<string>(key);
    if (serializedData === null) {
      return undefined;
    }

    return JSON.parse(serializedData) as TValue;
  } catch (err) {
    return undefined;
  }
}

export async function setStorageItem(
  key: string,
  value: unknown,
): Promise<void> {
  try {
    const serializedData = JSON.stringify(value);
    await localforage.setItem(key, serializedData);
  } catch (err) {
    console.warn(err);
  }
}

export async function removeStorageItem(key: string): Promise<void> {
  try {
    await localforage.removeItem(key);
  } catch (err) {
    console.warn(err);
  }
}

export async function getStorageKeysWithPrefix(
  prefix: string,
): Promise<string[]> {
  const cacheKeys = await localforage.keys();
  return cacheKeys.filter(Boolean).filter((key) => key.startsWith(prefix));
}
