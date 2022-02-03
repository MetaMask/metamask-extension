import localforage from 'localforage';

type SerializableValue = Record<string, unknown>;

export async function getStorageItem(
  key: string,
): Promise<SerializableValue | undefined> {
  try {
    const serializedData = await localforage.getItem<string | null>(key);
    if (serializedData === null) {
      return undefined;
    }

    return JSON.parse(serializedData) as SerializableValue;
  } catch (err) {
    return undefined;
  }
}

export async function setStorageItem(
  key: string,
  value: SerializableValue,
): Promise<void> {
  try {
    const serializedData = JSON.stringify(value);
    await localforage.setItem(key, serializedData);
  } catch (err) {
    console.warn(err);
  }
}
