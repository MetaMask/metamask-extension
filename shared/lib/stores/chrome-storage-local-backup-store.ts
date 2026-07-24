import browser from 'webextension-polyfill';
import { hasProperty, isObject } from '@metamask/utils';

const BACKUP_KEY = 'metamask-backup';

/**
 * Stores the recovery backup in chrome.storage.local when IndexedDB is the
 * primary state database.
 */
export class ChromeStorageLocalBackupStore {
  async set(values: Record<string, unknown>): Promise<void> {
    await browser.storage.local.set({ [BACKUP_KEY]: values });
  }

  async get(keys: string[]): Promise<unknown[]> {
    const result = await browser.storage.local.get([BACKUP_KEY]);
    const backup = result[BACKUP_KEY];
    return keys.map((key) =>
      isObject(backup) && hasProperty(backup, key) ? backup[key] : undefined,
    );
  }

  async reset(): Promise<void> {
    await browser.storage.local.remove([BACKUP_KEY]);
  }
}
