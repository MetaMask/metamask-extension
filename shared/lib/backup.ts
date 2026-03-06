import { hasProperty, isObject } from '@metamask/utils';

/**
 * Shape of the backup object read from the IndexedDB backup database.
 * Used for vault recovery and critical error restore.
 */
export type Backup = {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  KeyringController?: unknown;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  AppMetadataController?: unknown;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  MetaMetricsController?: unknown;
  meta?: unknown;
};

export const BACKUP_DB_NAME = 'metamask-backup';
export const BACKUP_DB_VERSION = 1;

export const backedUpStateKeys = [
  'KeyringController',
  'AppMetadataController',
  'MetaMetricsController',
] as const;

export type BackedUpStateKey = (typeof backedUpStateKeys)[number];

/** Default timeout for safeGetVaultBackup so the caller is never blocked by a hanging IndexedDB. */
export const SAFE_GET_VAULT_BACKUP_TIMEOUT_MS = 5_000;

/**
 * Reads the backup from the IndexedDB backup database without requiring a
 * PersistenceManager instance. Use this when the backup is needed in a context
 * where PersistenceManager may not be initialized (e.g. the critical error UI
 * after initialization timeout).
 *
 * Opens the backup DB, reads the same keys as PersistenceManager.getBackup,
 * then closes the connection.
 *
 * @returns The backup object, or undefined on error or if the DB cannot be opened.
 */
export async function readBackupFromIndexedDB(): Promise<Backup | undefined> {
  let db: IDBDatabase | undefined;
  try {
    db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(BACKUP_DB_NAME, BACKUP_DB_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains('store')) {
          database.createObjectStore('store');
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    const keys = [...backedUpStateKeys, 'meta'];
    const tx = db.transaction('store', 'readonly');
    const store = tx.objectStore('store');
    const results = await Promise.all(
      keys.map(
        (key) =>
          new Promise<unknown>((resolve, reject) => {
            const req = store.get(key);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
          }),
      ),
    );
    db.close();

    return Object.fromEntries(
      keys.map((key, i) => [key, results[i]]),
    ) as Backup;
  } catch {
    if (db) {
      try {
        db.close();
      } catch {
        // Ignore close errors when cleaning up after a failed read
      }
    }
    return undefined;
  }
}

/**
 * Reads the backup from IndexedDB with a timeout. Resolves to null on timeout or
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
  const backupPromise = readBackupFromIndexedDB().then((b) => b ?? null);
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
