import type { MfaFlowErrorCode } from '../../hooks/identity/mfa';
import type { MfaMethod } from '../../hooks/identity/mfa/engine/types';

/* eslint-disable @typescript-eslint/naming-convention -- the server's codes */
const METHOD_KEYS: Record<MfaMethod, string> = {
  email_otp: 'mfaMethodEmail',
  passkey: 'mfaMethodPasskey',
  totp: 'mfaMethodTotp',
};

const ERROR_KEYS: Partial<Record<MfaFlowErrorCode, string>> = {
  invalid_code: 'mfaErrorInvalidCode',
  flow_expired: 'mfaErrorCodeExpired',
  too_many_attempts: 'mfaErrorTooManyAttempts',
  invalid_assertion: 'mfaErrorInvalidPasskey',
  invalid_attestation: 'mfaErrorInvalidPasskey',
  passkey_ceremony_cancelled: 'mfaErrorPasskeyCancelled',
  credential_already_enrolled: 'mfaErrorEmailTaken',
  email_claimed: 'mfaErrorEmailTaken',
  otp_resend_cooldown: 'mfaErrorCooldown',
  rate_limited: 'mfaErrorCooldown',
  max_passkeys_reached: 'mfaErrorLimitReached',
  max_identifiers_reached: 'mfaErrorLimitReached',
  multi_primary_srp: 'mfaErrorMultiPrimarySrp',
  authentication_required: 'mfaErrorSignedOut',
  passkey_unsupported: 'mfaErrorUnsupported',
  flow_in_progress: 'mfaErrorFlowInProgress',
  totp_already_enrolled: 'mfaErrorTotpTaken',
};

const ERROR_LINKS: Partial<Record<MfaFlowErrorCode, string>> = {
  email_claimed: 'https://support.metamask.io/configure/wallet/email-in-use',
};

/**
 * Wording for authenticator app codes, which the app shows rather than an
 * email: a new code is in the app, not requested.
 */
const TOTP_ERROR_KEYS: Partial<Record<MfaFlowErrorCode, string>> = {
  invalid_code: 'mfaErrorInvalidTotpCode',
  flow_expired: 'mfaErrorTotpExpired',
  invalid_flow: 'mfaErrorTotpExpired',
  too_many_attempts: 'mfaErrorTotpTooManyAttempts',
};
/* eslint-enable @typescript-eslint/naming-convention */

/**
 * The help article for an error, if it has one.
 *
 * @param code - The error code.
 * @returns The article URL.
 */
export const getErrorLink = (code: MfaFlowErrorCode): string | undefined =>
  ERROR_LINKS[code];

export const getMethodLabelKey = (method: MfaMethod): string =>
  METHOD_KEYS[method];

/**
 * The message key for errors that have their own, rather than the generic one.
 *
 * @param code - The error's code.
 * @param method - The method the error is about, when its wording differs.
 * @returns The key, or `undefined` for the generic case.
 */
export const getSpecificErrorMessageKey = (
  code: MfaFlowErrorCode,
  method?: MfaMethod,
): string | undefined =>
  (method === 'totp' ? TOTP_ERROR_KEYS[code] : undefined) ?? ERROR_KEYS[code];

export const getErrorMessageKey = (
  code: MfaFlowErrorCode,
  method?: MfaMethod,
): string => getSpecificErrorMessageKey(code, method) ?? 'mfaErrorGeneric';
