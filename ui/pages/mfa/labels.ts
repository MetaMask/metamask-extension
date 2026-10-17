import type { MfaFlowErrorCode } from '../../hooks/identity/mfa';
import type { MfaMethod } from '../../hooks/identity/mfa/engine/types';

/* eslint-disable @typescript-eslint/naming-convention -- the server's codes */
const METHOD_KEYS: Record<MfaMethod, string> = {
  email_otp: 'mfaMethodEmail',
  passkey: 'mfaMethodPasskey',
};

const ERROR_KEYS: Partial<Record<MfaFlowErrorCode, string>> = {
  invalid_code: 'mfaErrorInvalidCode',
  flow_expired: 'mfaErrorCodeExpired',
  too_many_attempts: 'mfaErrorTooManyAttempts',
  invalid_assertion: 'mfaErrorInvalidPasskey',
  invalid_attestation: 'mfaErrorInvalidPasskey',
  passkey_ceremony_cancelled: 'mfaErrorPasskeyCancelled',
  credential_already_enrolled: 'mfaErrorEmailTaken',
  otp_resend_cooldown: 'mfaErrorCooldown',
  rate_limited: 'mfaErrorCooldown',
  max_passkeys_reached: 'mfaErrorLimitReached',
  max_identifiers_reached: 'mfaErrorLimitReached',
  multi_primary_srp: 'mfaErrorMultiPrimarySrp',
  authentication_required: 'mfaErrorSignedOut',
  passkey_unsupported: 'mfaErrorUnsupported',
  flow_in_progress: 'mfaErrorFlowInProgress',
};
/* eslint-enable @typescript-eslint/naming-convention */

export const getMethodLabelKey = (method: MfaMethod): string =>
  METHOD_KEYS[method];

/**
 * The message key for errors that have their own, rather than the generic one.
 *
 * @param code - The error's code.
 * @returns The key, or `undefined` for the generic case.
 */
export const getSpecificErrorMessageKey = (
  code: MfaFlowErrorCode,
): string | undefined => ERROR_KEYS[code];

export const getErrorMessageKey = (code: MfaFlowErrorCode): string =>
  getSpecificErrorMessageKey(code) ?? 'mfaErrorGeneric';
