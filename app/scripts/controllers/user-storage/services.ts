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
  const path = createEntryPath(opts.entryKey, opts.storageKey);
  const url = new URL(`${USER_STORAGE_ENDPOINT}${path}`);

  const encryptedData = await fetch(url.toString(), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${opts.bearerToken}`,
    },
  })
    .then((r) => {
      if (r.status === 404) {
        // Acceptable Error
        return null;
      }
      if (r.status !== 200) {
        throw new Error('Unable to get User Storage');
      }
      return r.json();
    })
    .then((r: GetUserStorageResponse | null) => r?.Data)
    .catch(() => null);

  if (!encryptedData) {
    return null;
  }

  try {
    const decryptedData = encryption.decryptString(
      encryptedData,
      opts.storageKey,
    );
    return decryptedData;
  } catch {
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
