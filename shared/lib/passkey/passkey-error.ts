import { PasskeyControllerErrorCode } from '@metamask/passkey-controller';

type PasskeyCode =
  (typeof PasskeyControllerErrorCode)[keyof typeof PasskeyControllerErrorCode];

/**
 * Maps {@link PasskeyControllerErrorCode} values to extension `messages.json` keys.
 */
const PASSKEY_ERROR_CODE_TO_I18N_KEY: Record<PasskeyCode, string> = {
  [PasskeyControllerErrorCode.NotEnrolled]: 'passkeyErrorNotEnrolled',
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
};

function translatePasskeyCode(
  code: string,
  t: (key: string) => string,
): string | null {
  if (code in PASSKEY_ERROR_CODE_TO_I18N_KEY) {
    return t(PASSKEY_ERROR_CODE_TO_I18N_KEY[code as PasskeyCode]);
  }
  return null;
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
 * **Extension UI:** MetaRPC + `serializeError` (`createMetaRPCHandler`) wraps failures;
 * the string `code` is on `data.cause`, not the numeric `JsonRpcError.code`.
 *
 * Resolution order:
 * 1. String `code` on the rejection when it is a known {@link PasskeyControllerErrorCode}.
 * 2. `data.cause.code` for MetaRPC-wrapped rejections.
 * 3. Otherwise `null` — callers typically use `?? t('passkeyUnlockFailed')`.
 *
 * @param error - Thrown value from background or in-page passkey flows.
 * @param t - The extension i18n translation function from `useI18nContext()`.
 */
export function translatePasskeyError(
  error: unknown,
  t: (key: string) => string,
): string | null {
  if (error === null || typeof error !== 'object') {
    return null;
  }
  const err = error as { code?: unknown; data?: unknown };
  const causeCode = getCauseCode(err.data);
  let code: string | null = null;

  if (typeof err.code === 'string') {
    code = err.code;
  } else if (typeof causeCode === 'string') {
    code = causeCode;
  }

  if (code === null) {
    return null;
  }

  return translatePasskeyCode(code, t);
}
