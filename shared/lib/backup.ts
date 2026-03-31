import { hasProperty, isObject } from '@metamask/utils';

import { IndexedDBStore } from './indexeddb-store';

export const BACKUP_DB_NAME = 'metamask-backup';
export const BACKUP_DB_VERSION = 1;

export const backedUpStateKeys = [
  'KeyringController',
  'AppMetadataController',
  'MetaMetricsController',
] as const;

export type BackedUpStateKey = (typeof backedUpStateKeys)[number];

/**
 * Shape of the backup object read from the IndexedDB backup database.
 * Used for vault recovery and critical error restore.
 * Keys are derived from backedUpStateKeys (single source of truth).
 */
export type Backup = {
  [K in BackedUpStateKey]?: unknown;
} & {
  meta?: unknown;
};

/** Default timeout for safeGetVaultBackup so the caller is never blocked by a hanging IndexedDB. */
export const SAFE_GET_VAULT_BACKUP_TIMEOUT_MS = 5_000;

/**
 * Loads the persisted vault backup snapshot from the IndexedDB backup database
 * without requiring a PersistenceManager instance. Use when backup state is
 * needed where PersistenceManager may not be initialized (e.g. critical error
 * UI after initialization timeout).
 *
 * Opens the backup DB, reads the same keys as PersistenceManager.getBackup,
 * then closes the connection.
 *
 * @returns The backup object, or undefined on error or if the DB cannot be opened.
 */
export async function getVaultBackup(): Promise<Backup | undefined> {
  const store = new IndexedDBStore();
  try {
    await store.open(BACKUP_DB_NAME, BACKUP_DB_VERSION);
    const keys = [...backedUpStateKeys, 'meta'];
    const results = await store.get(keys);
    store.close();
    return Object.fromEntries(
      keys.map((key, i) => [key, results[i]]),
    ) as Backup;
  } catch {
    store.close();
    return undefined;
  }
}

/**
 * Calls {@link getVaultBackup} with a timeout race. Resolves to null on timeout or
 * error so the caller is never blocked by a hanging IndexedDB (e.g. critical
 * error page).
 *
 * @param timeoutMs - Timeout in milliseconds. Defaults to {@link SAFE_GET_VAULT_BACKUP_TIMEOUT_MS}.
 * @returns The backup object or null on timeout/error.
 */
export async function safeGetVaultBackup(
  timeoutMs: number = SAFE_GET_VAULT_BACKUP_TIMEOUT_MS,
): Promise<Backup | null> {
  const timeoutPromise = new Promise<Backup | null>((resolve) => {
    setTimeout(() => resolve(null), timeoutMs);
  });
  const backupPromise = getVaultBackup().then((b) => b ?? null);
  return Promise.race([backupPromise, timeoutPromise]);
}

/**
 * Checks if the backup object has a vault (KeyringController with vault).
 *
 * @param backup - The backup object to check for a vault.
 * @returns True if the vault exists, otherwise false.
 */
export function hasVault(backup: Backup | null): boolean {
  if (isObject(backup) && hasProperty(backup, 'KeyringController')) {
    const keyringController = backup.KeyringController;
    if (
      isObject(keyringController) &&
      hasProperty(keyringController, 'vault')
    ) {
      return Boolean(keyringController.vault);
    }
  }
  return false;
}
