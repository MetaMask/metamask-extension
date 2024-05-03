import log from 'loglevel';

import encryption from './encryption';
import { UserStorageEntryKeys, createEntryPath } from './schema';

export const USER_STORAGE_API = process.env.USER_STORAGE_API || '';
export const USER_STORAGE_ENDPOINT = `${USER_STORAGE_API}/api/v1/userstorage`;

export type GetUserStorageResponse = {
  HashedKey: string;
  Data: string;
};

export type UserStorageOptions = {
  bearerToken: string;
  entryKey: UserStorageEntryKeys;
  storageKey: string;
};

export async function getUserStorage(
  opts: UserStorageOptions,
): Promise<string | null> {
  try {
    const path = createEntryPath(opts.entryKey, opts.storageKey);
    const url = new URL(`${USER_STORAGE_ENDPOINT}${path}`);

    const userStorageResponse = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${opts.bearerToken}`,
      },
    });

    // Acceptable error - since indicates entry does not exist.
    if (userStorageResponse.status === 404) {
      return null;
    }

    if (userStorageResponse.status !== 200) {
      throw new Error('Unable to get User Storage');
    }

    const userStorage: GetUserStorageResponse | null =
      await userStorageResponse.json();
    const encryptedData = userStorage?.Data ?? null;

    if (!encryptedData) {
      return null;
    }

    const decryptedData = encryption.decryptString(
      encryptedData,
      opts.storageKey,
    );

    return decryptedData;
  } catch (e) {
    log.error('Failed to get user storage', e);
    return null;
  }
}

export async function upsertUserStorage(
  data: string,
  opts: UserStorageOptions,
): Promise<void> {
  const encryptedData = encryption.encryptString(data, opts.storageKey);
  const path = createEntryPath(opts.entryKey, opts.storageKey);
  const url = new URL(`${USER_STORAGE_ENDPOINT}${path}`);

  const res = await fetch(url.toString(), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${opts.bearerToken}`,
    },
    body: JSON.stringify({ data: encryptedData }),
  });

  if (!res.ok) {
    throw new Error('user-storage - unable to upsert data');
  }
}
