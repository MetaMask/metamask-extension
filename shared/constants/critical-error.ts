import { CORRUPTION_BLOCK_CHECKSUM_MISMATCH, type ErrorLike } from './errors';

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

/**
 * The subset of {@link CriticalErrorType} that describes unusable persisted
 * state.
 */
export const StateCorruptionErrorType = {
  MissingVaultInDatabase: CriticalErrorType.MissingVaultInDatabase,
  InaccessibleDatabase: CriticalErrorType.InaccessibleDatabase,
} as const;

export type StateCorruptionErrorType =
  (typeof StateCorruptionErrorType)[keyof typeof StateCorruptionErrorType];

/**
 * Checks whether a value is a state-corruption critical error type.
 *
 * @param value - The value to check.
 * @returns Whether the value is a state-corruption critical error type.
 */
export function isStateCorruptionErrorType(
  value: unknown,
): value is StateCorruptionErrorType {
  return Object.values(StateCorruptionErrorType).some(
    (errorType) => errorType === value,
  );
}

/**
 * Determines whether an error leaves the persisted state unusable, and if so
 * which kind of corruption it is.
 *
 * `PersistenceError` states its `corruptionType` outright. The block checksum
 * mismatch is raised by the browser rather than by us, so it cannot carry a
 * `corruptionType` and its message is the only available signal.
 *
 * @param error - The serialized error to classify.
 * @returns The corruption type, or undefined when the state is not corrupted.
 */
export function getStateCorruptionErrorType(
  error: ErrorLike,
): StateCorruptionErrorType | undefined {
  if (isStateCorruptionErrorType(error.corruptionType)) {
    return error.corruptionType;
  }
  if (error.message === CORRUPTION_BLOCK_CHECKSUM_MISMATCH) {
    return StateCorruptionErrorType.InaccessibleDatabase;
  }
  return undefined;
}

export const CriticalErrorRepairAction = {
  None: 'none',
  Recover: 'recover',
  Reset: 'reset',
} as const;

export type CriticalErrorRepairAction =
  (typeof CriticalErrorRepairAction)[keyof typeof CriticalErrorRepairAction];
