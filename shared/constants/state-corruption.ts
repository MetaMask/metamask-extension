export const METHOD_REPAIR_DATABASE = 'repairDatabase';

export const METHOD_DISPLAY_STATE_CORRUPTION_ERROR =
  'displayStateCorruptionError';

/**
 * Types of vault corruption that can be detected.
 */
export enum VaultCorruptionType {
  /**
   * The database is accessible but the vault data is missing.
   */
  MissingVaultInDatabase = 'missing_vault_in_database',
  /**
   * The database itself is inaccessible (e.g., Firefox's "An unexpected error occurred").
   */
  UnaccessibleDatabase = 'unaccessible_database',
}
