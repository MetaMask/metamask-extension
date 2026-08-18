/**
 * Google Password Manager (passkey authenticator model).
 * Module-private; call sites should use {@link isPasskeyAaguidIncompatibleWithSidepanel}.
 * @see https://web.dev/articles/webauthn-aaguid
 * @see https://github.com/passkeydeveloper/passkey-authenticator-aaguids/blob/main/aaguid.json
 */
const GOOGLE_PASSWORD_MANAGER_PASSKEY_AAGUID =
  'ea9b8d66-4d01-1d21-3ce4-b6b48cb575d4';
const WINDOWS_HELLO_PASSKEY_AAGUIDS = [
  '08987058-cadc-4b81-b6e1-30de50dcbe96',
  '9ddd1817-af5a-4672-a2b9-3e3dd95000a9',
  '6028b017-b1d4-4c02-b4b3-afcdafc96bb2',
];
const APPLE_PASSKEY_AAGUIDS = [
  'dd4ec289-e01d-41c9-bb89-70fa845d4bf2',
  'fbfc3007-154e-4ecc-8c0b-6e020557d7bd',
];
const ONE_PASSWORD_PASSKEY_AAGUID = 'bada5566-a7aa-401f-bd96-45619a55120d';

const PASSKEY_AUTHENTICATOR_NAMES = new Map<string, string>([
  [GOOGLE_PASSWORD_MANAGER_PASSKEY_AAGUID, 'google_password_manager'],
  ...WINDOWS_HELLO_PASSKEY_AAGUIDS.map(
    (aaguid) => [aaguid, 'windows_hello'] as const,
  ),
  ...APPLE_PASSKEY_AAGUIDS.map((aaguid) => [aaguid, 'apple'] as const),
  [ONE_PASSWORD_PASSKEY_AAGUID, 'onepassword'],
]);

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

/**
 * Returns the name of the passkey authenticator for the given AAGUID.
 * @param aaguid
 */
export function getPasskeyAuthenticatorName(
  aaguid: string | undefined | null,
): string {
  const normalized = normalizePasskeyAaguid(aaguid);
  return normalized === null
    ? 'unknown'
    : (PASSKEY_AUTHENTICATOR_NAMES.get(normalized) ?? 'unknown');
}
