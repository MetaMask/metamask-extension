/**
 * After a manual lock, auto passkey unlock is suppressed for this duration (cross-surface)
 * so the user is not immediately prompted again when opening the wallet.
 */
export const PASSKEY_AUTO_UNLOCK_SUPPRESSION_DURATION_MS = 1_000;

/**
 * Maximum number of times the legacy passkey PRF migration notice is shown.
 */
export const PASSKEY_PRF_MIGRATION_NOTICE_MAX_COUNT = 2;
