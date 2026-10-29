/**
 * Google Password Manager (passkey authenticator model).
 * Module-private; call sites should use {@link isPasskeyAaguidIncompatibleWithSidepanel}.
 * @see https://web.dev/articles/webauthn-aaguid
 * @see https://github.com/passkeydeveloper/passkey-authenticator-aaguids/blob/main/aaguid.json
 */
const GOOGLE_PASSWORD_MANAGER_PASSKEY_AAGUID =
  'ea9b8d66-4d01-1d21-3ce4-b6b48cb575d4';

/**
 * AAGUIDs for passkey authenticators that should not run passkey ceremonies in
 * the extension side panel; open a normal extension tab instead.
 * Add entries with a comment / issue link when a provider fails in sidepanel.
 */
const PASSKEY_AAGUIDS_INCOMPATIBLE_WITH_SIDEPANEL: ReadonlySet<string> =
  new Set([GOOGLE_PASSWORD_MANAGER_PASSKEY_AAGUID]);

/**
 * Normalizes a stored passkey AAGUID for Set lookup (trim + lowercase).
 * Returns null if the value is missing or whitespace-only.
 * @param raw
 */
export function normalizePasskeyAaguid(
  raw: string | undefined | null,
): string | null {
  if (raw === undefined || raw === null || typeof raw !== 'string') {
    return null;
  }
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }
  return trimmed;
}

/**
 * True when this authenticator AAGUID is known to misbehave for passkey
 * ceremonies inside the extension side panel (defer to a normal browser tab).
 *
 * @param aaguid
 */
export function isPasskeyAaguidIncompatibleWithSidepanel(
  aaguid: string | undefined | null,
): boolean {
  const normalized = normalizePasskeyAaguid(aaguid);
  if (normalized === null) {
    return false;
  }
  return PASSKEY_AAGUIDS_INCOMPATIBLE_WITH_SIDEPANEL.has(normalized);
}
