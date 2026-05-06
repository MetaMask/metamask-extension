import { PASSKEY_AAGUIDS_INCOMPATIBLE_WITH_SIDEPANEL } from '../../constants/passkey';

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
 * Add AAGUIDs to {@link PASSKEY_AAGUIDS_INCOMPATIBLE_WITH_SIDEPANEL} only with
 * a short comment / issue link—do not branch per provider in UI code.
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
