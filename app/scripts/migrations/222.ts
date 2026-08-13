import browser from 'webextension-polyfill';
import { STORAGE_KEY_PREFIX } from '@metamask/storage-service';
import { isIndexedDBMutationBlockedError } from '../../../shared/lib/stores/indexeddb-storage-adapter';
import {
  STORAGE_SERVICE_INDEXED_DB_FALLBACK_KEY,
  STORAGE_SERVICE_INDEXED_DB_FALLBACK_NAMESPACE,
  STORAGE_SERVICE_INDEXED_DB_NAME,
  STORAGE_SERVICE_INDEXED_DB_VERSION,
} from '../../../shared/lib/stores/indexeddb-storage-constants';
import { IndexedDBStore } from '../../../shared/lib/stores/indexeddb-store';
import type { Migrate } from './types';

export const version = 222;

const FALLBACK_MARKER_STORAGE_KEY = `${STORAGE_KEY_PREFIX}${STORAGE_SERVICE_INDEXED_DB_FALLBACK_NAMESPACE}:${STORAGE_SERVICE_INDEXED_DB_FALLBACK_KEY}`;

/**
 * Moves legacy StorageService data from browser.storage.local to IndexedDB.
 * @param versionedData
 * @param _changedKeys
 */
export const migrate = (async (versionedData, _changedKeys) => {
  versionedData.meta.version = version;

  const storageLocal = browser.storage?.local;
  if (!storageLocal) {
    return;
  }

  const allStorage = await storageLocal.get(null);
  if (FALLBACK_MARKER_STORAGE_KEY in allStorage) {
    return;
  }

  const storageServiceEntries = Object.entries(allStorage).filter(([key]) => {
    return key.startsWith(STORAGE_KEY_PREFIX);
  });
  if (storageServiceEntries.length === 0) {
    return;
  }

  const database = new IndexedDBStore();
  try {
    try {
      await database.open(
        STORAGE_SERVICE_INDEXED_DB_NAME,
        STORAGE_SERVICE_INDEXED_DB_VERSION,
      );
    } catch (error) {
      if (isIndexedDBMutationBlockedError(error)) {
        await storageLocal.set({ [FALLBACK_MARKER_STORAGE_KEY]: true });
        console.warn(
          `Migration #${version}: IndexedDB is unavailable; keeping StorageService data in browser.storage.local.`,
        );
        return;
      }

      throw error;
    }

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
