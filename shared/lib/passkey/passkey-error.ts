import { PasskeyControllerErrorCode } from '@metamask/passkey-controller';

import { PasskeyCeremonyTimeoutError } from './passkey-ceremony';

/**
 * Stable programmatic codes for passkey-related errors thrown by the extension.
 */
export const ExtensionPasskeyErrorCode = {
  VaultKeyRenewalFailed: 'extension_vault_key_renewal_failed',
} as const;

/**
 * Maps passkey error `code` strings (controller + extension) to extension `messages.json` keys.
 */
const PASSKEY_ERROR_CODE_TO_I18N_KEY: Record<string, string> = {
  [PasskeyControllerErrorCode.NotEnrolled]: 'passkeyErrorNotEnrolled',
  [PasskeyControllerErrorCode.AlreadyEnrolled]: 'passkeyErrorAlreadyEnrolled',
  [PasskeyControllerErrorCode.NoRegistrationCeremony]:
    'passkeyErrorNoRegistrationCeremony',
  [PasskeyControllerErrorCode.RegistrationVerificationFailed]:
    'passkeyErrorRegistrationVerificationFailed',
  [PasskeyControllerErrorCode.NoAuthenticationCeremony]:
    'passkeyErrorNoAuthenticationCeremony',
  [PasskeyControllerErrorCode.AuthenticationVerificationFailed]:
    'passkeyErrorAuthenticationVerificationFailed',
  [PasskeyControllerErrorCode.MissingKeyMaterial]:
    'passkeyErrorMissingKeyMaterial',
  [PasskeyControllerErrorCode.VaultKeyDecryptionFailed]:
    'passkeyErrorVaultKeyDecryptionFailed',
  [PasskeyControllerErrorCode.VaultKeyMismatch]: 'passkeyErrorVaultKeyMismatch',
  [ExtensionPasskeyErrorCode.VaultKeyRenewalFailed]:
    'passkeyErrorVaultKeyRenewalFailed',
};

/**
 * Reads a stable passkey-related string `code` from a thrown value (direct or MetaRPC-wrapped).
 *
 * @param error - Thrown value from background or in-page passkey flows.
 * @returns The string code, or `null` if none is present.
 */
export function getPasskeyControllerErrorCode(error: unknown): string | null {
  if (error === null || typeof error !== 'object') {
    return null;
  }
  const err = error as { code?: unknown; data?: unknown };
  const causeCode = getCauseCode(err.data);

  if (typeof err.code === 'string') {
    return err.code;
  }
  if (typeof causeCode === 'string') {
    return causeCode;
  }
  return null;
}

/**
 * Analytics-oriented passkey ceremony failure: `timeout`, WebAuthn `not_allowed` /
 * `aborted`, else {@link getPasskeyControllerErrorCode}, else `unknown`.
 *
 * @param err - Thrown value from a passkey ceremony.
 */
export function getPasskeyErrorCode(err: unknown): string {
  if (err instanceof PasskeyCeremonyTimeoutError) {
    return 'timeout';
  }
  if (err instanceof Error) {
    if (err.name === 'NotAllowedError') {
      return 'not_allowed';
    }
    if (err.name === 'AbortError') {
      return 'aborted';
    }
  }
  return getPasskeyControllerErrorCode(err) ?? 'unknown';
}

function translatePasskeyCode(
  code: string,
  t: (key: string, substitutions?: string[]) => string,
  authMethodLabel: string,
): string | null {
  const i18nKey = PASSKEY_ERROR_CODE_TO_I18N_KEY[code];
  return i18nKey === undefined ? null : t(i18nKey, [authMethodLabel]);
}

function getCauseCode(data: unknown): unknown {
  if (!data || typeof data !== 'object' || !('cause' in data)) {
    return undefined;
  }

  const { cause } = data as { cause?: unknown };
  if (!cause || typeof cause !== 'object' || !('code' in cause)) {
    return undefined;
  }

  return (cause as { code?: unknown }).code;
}

/**
 * Translate a passkey error to a user-facing string using the extension i18n system.
 *
 * **Controller:** `PasskeyController` throws `PasskeyControllerError` with a stable
 * string `code` (see `@metamask/passkey-controller`).
 *
 * **Extension:** the background may attach `ExtensionPasskeyErrorCode` on the same shape.
 *
 * **Extension UI:** MetaRPC + `serializeError` (`createMetaRPCHandler`) wraps failures;
 * the string `code` is on `data.cause`, not the numeric `JsonRpcError.code`.
 *
 * Resolution order:
 * 1. String `code` on the rejection when it matches a known entry in the map above.
 * 2. `data.cause.code` for MetaRPC-wrapped rejections.
 * 3. Otherwise `null` — callers typically use `?? t('passkeyUnlockFailed', [authMethodLabel])`.
 *
 * @param error - Thrown value from background or in-page passkey flows.
 * @param t - The extension i18n translation function from `useI18nContext()`.
 * @param authMethodLabel - OS-specific passkey auth-method noun ("Biometrics" /
 * "Touch ID" / "Windows Hello"); UI typically passes
 * `t(getPasskeyAuthMethodKey())` (same noun as buttons / toasts, not the `{ specific: true }` variant).
 */
export function translatePasskeyError(
  error: unknown,
  t: (key: string, substitutions?: string[]) => string,
  authMethodLabel: string,
): string | null {
  const code = getPasskeyControllerErrorCode(error);
  if (code === null) {
    return null;
  }
  return translatePasskeyCode(code, t, authMethodLabel);
}
