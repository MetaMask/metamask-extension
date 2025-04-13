import localforage from 'localforage';

export async function getStorageItem(key: string): Promise<Object | undefined> {
  try {
    const serializedData = await localforage.getItem(key);
    if (serializedData === null) {
      return undefined;
    }

    return JSON.parse(serializedData as string);
  } catch (err) {
    return undefined;
  }
}

export async function setStorageItem(key: string, value: string) {
  try {
    const serializedData = JSON.stringify(value);
    await localforage.setItem(key, serializedData);
  } catch (err) {
    console.warn(err);
  }
}
