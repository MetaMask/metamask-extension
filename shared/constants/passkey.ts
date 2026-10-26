/**
 * After a manual lock, auto passkey unlock is suppressed for this duration (cross-surface)
 * so a slow unlock screen cannot start a passkey ceremony before the user chooses how to unlock.
 */
export const PASSKEY_AUTO_UNLOCK_SUPPRESSION_DURATION_MS = 5_000;

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
