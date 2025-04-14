import localforage from 'localforage';

export async function getStorageItem(key) {
  try {
    const serializedData = await localforage.getItem(key);
    if (serializedData === null) {
      return undefined;
    }

    return JSON.parse(serializedData);
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31889
  // eslint-disable-next-line id-denylist
  } catch (err) {
    return undefined;
  }
}

export async function setStorageItem(key, value) {
  try {
    const serializedData = JSON.stringify(value);
    await localforage.setItem(key, serializedData);
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31889
  // eslint-disable-next-line id-denylist
  } catch (err) {
    console.warn(err);
  }
}
