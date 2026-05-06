/**
 * After a manual lock, auto passkey unlock is suppressed for this duration (cross-surface)
 * so the user is not immediately prompted again when opening the wallet.
 */
export const PASSKEY_AUTO_UNLOCK_SUPPRESSION_DURATION_MS = 1_000;

/**
 * Google Password Manager (passkey authenticator model).
 * @see https://web.dev/articles/webauthn-aaguid
 * @see https://github.com/passkeydeveloper/passkey-authenticator-aaguids/blob/main/aaguid.json
 */
export const GOOGLE_PASSWORD_MANAGER_PASSKEY_AAGUID =
  'ea9b8d66-4d01-1d21-3ce4-b6b48cb575d4';

/**
 * AAGUIDs for passkey authenticators that should not run passkey ceremonies in
 * the extension side panel; open a normal extension tab instead.
 * Add entries with a comment / issue link when a provider fails in sidepanel.
 */
export const PASSKEY_AAGUIDS_INCOMPATIBLE_WITH_SIDEPANEL: ReadonlySet<string> =
  new Set([GOOGLE_PASSWORD_MANAGER_PASSKEY_AAGUID]);
