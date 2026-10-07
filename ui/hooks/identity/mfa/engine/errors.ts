import { getMfaErrorCode } from '@metamask/profile-sync-controller/sdk';
import type { MfaFlowErrorCode, MfaMethod, MfaErrorHandling } from './types';

// Keys are the server's error codes, which are snake_case.
/* eslint-disable @typescript-eslint/naming-convention */
const HANDLING: Record<MfaFlowErrorCode, MfaErrorHandling> = {
  aal2_required: 'refresh',
  email_socially_verified: 'refresh',
  email_already_enrolled: 'refresh',
  credential_not_enrolled: 'refresh',
  mfa_identity_missing: 'refresh',
  verification_token_invalid: 'refresh',

  invalid_code: 'inline',
  invalid_assertion: 'inline',
  invalid_attestation: 'inline',
  passkey_ceremony_cancelled: 'inline',
  credential_already_enrolled: 'inline',

  flow_expired: 'restart',
  invalid_flow: 'restart',
  too_many_attempts: 'restart',

  otp_resend_cooldown: 'cooldown',
  rate_limited: 'cooldown',

  max_passkeys_reached: 'failure',
  max_identifiers_reached: 'failure',
  multi_primary_srp: 'failure',
  invalid_response: 'failure',
  invalid_request: 'failure',
  passkey_unsupported: 'failure',
  authentication_required: 'failure',
  flow_cancelled: 'failure',
  flow_in_progress: 'failure',

  kratos_unavailable: 'transient',
  server_error: 'transient',
};
/* eslint-enable @typescript-eslint/naming-convention */

/**
 * The error's MFA code; `server_error` when it has none (network down) or one
 * this kit does not know.
 *
 * @param error - Anything thrown by a controller call or a passkey adapter.
 * @returns A known code.
 */
export const getFlowErrorCode = (error: unknown): MfaFlowErrorCode => {
  const code = getMfaErrorCode(error);
  return code !== undefined && Object.hasOwn(HANDLING, code)
    ? (code as MfaFlowErrorCode)
    : 'server_error';
};

export const getErrorHandling = (code: MfaFlowErrorCode): MfaErrorHandling =>
  HANDLING[code];

/**
 * Rejection of `verifyOrEnroll` and `enroll`. `mfaCode` is what
 * `getMfaErrorCode()` reads, so consumers branch on it like any MFA error.
 */
export class MfaFlowError extends Error {
  readonly mfaCode: MfaFlowErrorCode;

  readonly data: { completed: MfaMethod[] };

  constructor(mfaCode: MfaFlowErrorCode, completed: MfaMethod[] = []) {
    super(`MFA[${mfaCode}]`);
    this.name = 'MfaFlowError';
    this.mfaCode = mfaCode;
    this.data = { completed };
  }
}
