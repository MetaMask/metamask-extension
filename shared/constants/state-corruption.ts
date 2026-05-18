import {
  CORRUPTION_BLOCK_CHECKSUM_MISMATCH,
  INACCESSIBLE_DATABASE_ERROR,
  type ErrorLike,
  MISSING_VAULT_ERROR,
} from './errors';

export const METHOD_REPAIR_DATABASE = 'repairDatabase';

export const METHOD_DISPLAY_STATE_CORRUPTION_ERROR =
  'displayStateCorruptionError';

/**
 * Type of critical error, including startup failures and database corruption.
 */
export const CriticalErrorType = {
  BackgroundConnectionTimeout: 'background_connection_timeout',
  BackgroundInitTimeout: 'background_init_timeout',
  BackgroundStateSyncTimeout: 'background_state_sync_timeout',
  GeneralStartupError: 'general_startup_error',
  MissingVaultInDatabase: 'missing_vault_in_database',
  InaccessibleDatabase: 'inaccessible_database',
  UnreachableLivenessCheck: 'unreachable_liveness_check',
  UnreachableInitializationCheck: 'unreachable_initialization_check',
  Other: 'other',
} as const;

export type CriticalErrorType =
  (typeof CriticalErrorType)[keyof typeof CriticalErrorType];

const STATE_CORRUPTION_CRITICAL_ERROR_TYPES = [
  CriticalErrorType.MissingVaultInDatabase,
  CriticalErrorType.InaccessibleDatabase,
] as const;

export function isStateCorruptionErrorType(
  errorType: CriticalErrorType | undefined,
): boolean {
  if (!errorType) {
    return false;
  }
  return STATE_CORRUPTION_CRITICAL_ERROR_TYPES.includes(
    errorType as (typeof STATE_CORRUPTION_CRITICAL_ERROR_TYPES)[number],
  );
}

export function getStateCorruptionErrorType(
  error: ErrorLike,
): CriticalErrorType {
  if (error.message === MISSING_VAULT_ERROR) {
    return CriticalErrorType.MissingVaultInDatabase;
  }
  if (
    error.message === INACCESSIBLE_DATABASE_ERROR ||
    error.message === CORRUPTION_BLOCK_CHECKSUM_MISMATCH
  ) {
    return CriticalErrorType.InaccessibleDatabase;
  }

  return CriticalErrorType.Other;
}

export const CriticalErrorRepairAction = {
  None: 'none',
  Recover: 'recover',
  Reset: 'reset',
} as const;

export type CriticalErrorRepairAction =
  (typeof CriticalErrorRepairAction)[keyof typeof CriticalErrorRepairAction];
