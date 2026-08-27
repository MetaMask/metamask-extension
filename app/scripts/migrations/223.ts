import browser from 'webextension-polyfill';
import { STORAGE_KEY_PREFIX } from '@metamask/storage-service';
import {
  STORAGE_SERVICE_INDEXED_DB_NAME,
  STORAGE_SERVICE_INDEXED_DB_VERSION,
} from '../../../shared/lib/stores/indexeddb-storage-constants';
import { IndexedDBStore } from '../../../shared/lib/stores/indexeddb-store';

import { getPlatform } from '../lib/util';
import { PLATFORM_FIREFOX } from '../../../shared/constants/app';
import type { Migrate } from './types';

export const version = 223;

/**
 * Moves StorageService data from browser.storage.local to IndexedDB in chrome.
 *
 * This is a weird migration, because it doesn't actually migrate
 * `versionedData`; but instead migrates some other internal data. We don't yet
 * have a system for migrating indexedDB data yet, nor do we have a way to
 * migrate between database systems.
 *
 * The reason for the migration is to ensure storage.local on chrome is ONLY
 * used for application data, and not for any other random bits of data, as
 * Chrome has a hard time storing large keys, like those used by Snaps. These
 * large key/values can effect the stability and reliability of _other_ keys in
 * the database, resulting in database corruption.
 *
 * @param versionedData
 * @param _changedKeys
 */
export const migrate = (async (versionedData, _changedKeys) => {
  versionedData.meta.version = version;

  // Chrome has an issue with its `storage.local` implementation -- it doesn't
  // like sharing the database with "large" keys, like Snaps source code.
  // Firefox doesn't have any issues with storage stability in storage.local,
  // but users are able to turn `indexedDB` completely _off_ in Firefox. We
  // can reasonably fall back to storage.local in such cases, since we'd be
  // missing data that once existed... and to make things more complicated,
  // if a user turns `indexedDB` back on later, the old "missing" data comes
  // back like it was never missing in the first place.
  // So, on FireFox, we report `indexedDb` as unavailable.
  if (getPlatform() === PLATFORM_FIREFOX) {
    return;
  }

  const storageLocal = browser.storage.local;

  let allStorage: Record<string, unknown>;
  if (typeof storageLocal.getKeys === 'function') {
    const allKeys = await storageLocal.getKeys();
    const storageServiceKeys = allKeys.filter((key) =>
      key.startsWith(STORAGE_KEY_PREFIX),
    );
    if (storageServiceKeys.length === 0) {
      console.warn(`Migration ${version}: No storage service keys found.`);
      return;
    }

    allStorage = await storageLocal.get(storageServiceKeys);
  } else {
    allStorage = await storageLocal.get(null);
  }

  const storageServiceEntries = Object.entries(allStorage).filter(([key]) => {
    return key.startsWith(STORAGE_KEY_PREFIX);
  });
  if (storageServiceEntries.length === 0) {
    console.warn(`Migration ${version}: No storage service keys found.`);
    return;
  }

  const database = new IndexedDBStore();
  try {
    await database.open(
      STORAGE_SERVICE_INDEXED_DB_NAME,
      STORAGE_SERVICE_INDEXED_DB_VERSION,
    );

    const storageServiceKeys = storageServiceEntries.map(([key]) => key);
    const existingValues = await database.get(storageServiceKeys);
    const entriesToMigrate = storageServiceEntries.filter((_, index) => {
      return existingValues[index] === undefined;
    });

    if (entriesToMigrate.length > 0) {
      await database.set(Object.fromEntries(entriesToMigrate));
    }

    await storageLocal.remove(storageServiceKeys);
  } finally {
    database.close();
  }
}) satisfies Migrate;
