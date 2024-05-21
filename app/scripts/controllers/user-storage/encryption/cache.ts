import { base64ToByteArray, byteArrayToBase64 } from './utils';

type CachedEntry = {
  salt: Uint8Array;
  base64Salt: string;
  key: Uint8Array;
};

/**
 * In Memory Cache of the derived key from a given salt.
 * We can tidy this to make it reusable with future versions and KDF functions
 */
const inMemCachedKDF: Map<string, Uint8Array> = new Map();

/**
 *
 * @param salt provide salt to receive cached key
 * @returns cached key
 */
export function getCachedKeyBySalt(salt: Uint8Array): CachedEntry | undefined {
  const base64Salt = byteArrayToBase64(salt);
  const cachedKey = inMemCachedKDF.get(base64Salt);
  if (!cachedKey) {
    return undefined;
  }

  return {
    salt,
    base64Salt,
    key: cachedKey,
  };
}

/**
 *
 * @returns any (the first) cached key
 */
export function getAnyCachedKey(): CachedEntry | undefined {
  const cachedEntry: [string, Uint8Array] | undefined = inMemCachedKDF
    .entries()
    .next().value;

  if (!cachedEntry) {
    return undefined;
  }

  const base64Salt = cachedEntry[0];
  const bytesSalt = base64ToByteArray(base64Salt);
  return {
    salt: bytesSalt,
    base64Salt,
    key: cachedEntry[1],
  };
}

/**
 * Sets a key to the in memory cache.
 * We have set an arbitrary size of 10 cached keys
 * @param salt
 * @param key
 */
export function setCachedKey(salt: Uint8Array, key: Uint8Array): void {
  const base64Salt = byteArrayToBase64(salt);

  // Size check
  if (inMemCachedKDF.size >= 10) {
    for (let i = 0; i >= inMemCachedKDF.size - 10; i++) {
      const key = getAnyCachedKey();
      if (key) {
        inMemCachedKDF.delete(key.base64Salt);
      }
    }
  }

  inMemCachedKDF.set(base64Salt, key);
}
