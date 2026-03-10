export const METHOD_REPAIR_DATABASE = 'repairDatabase';

/** Used by the critical error screen (init/state-sync timeout). */
export const METHOD_REPAIR_DATABASE_TIMEOUT = 'repairDatabaseTimeout';

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
  InaccessibleDatabase = 'inaccessible_database',
  /**
   * Unknown corruption type. Used as a fallback for unexpected error types. (shouldn't happen in practice)
   */
  Unknown = 'unknown',
}

/**
 * Type of critical startup error (timeout or other).
 */
export enum CriticalErrorType {
  BackgroundConnectionTimeout = 'background_connection_timeout',
  BackgroundInitTimeout = 'background_init_timeout',
  BackgroundStateSyncTimeout = 'background_state_sync_timeout',
  GeneralStartupError = 'general_startup_error',
  TroubleStarting = 'trouble_starting',
  UnreachableLivenessCheck = 'unreachable_liveness_check',
  UnreachableInitializationCheck = 'unreachable_initialization_check',
  Other = 'other',
}
