import { hasProperty, isObject } from '@metamask/utils';

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
