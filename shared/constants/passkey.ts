/**
 * After a manual lock, auto passkey unlock is suppressed for this duration (cross-surface)
 * so the user is not immediately prompted again when opening the wallet.
 */
export const PASSKEY_AUTO_UNLOCK_SUPPRESSION_DURATION_MS = 1_000;

/**
 * Stages emitted during passkey enrollment and replacement.
 */
export const PASSKEY_STAGES = {
  REGISTER: 'register',
  VERIFY: 'verify',
  ENROLL: 'enroll',
  COMPLETE: 'complete',
} as const;

export type PasskeyStage = (typeof PASSKEY_STAGES)[keyof typeof PASSKEY_STAGES];
