import { getMfaErrorCode } from '@metamask/profile-sync-controller/sdk';
import type {
  MfaFlowErrorCode,
  MfaFlowState,
  MfaMethod,
  MfaErrorHandling,
} from './types';

// Keys are the server's error codes, which are snake_case.
/* eslint-disable @typescript-eslint/naming-convention */
const HANDLING: Record<MfaFlowErrorCode, MfaErrorHandling> = {
  aal2_required: 'refresh',
  email_socially_verified: 'refresh',
  email_already_enrolled: 'refresh',
  totp_already_enrolled: 'refresh',
  credential_not_enrolled: 'refresh',
  credential_not_found: 'refresh',
  mfa_identity_missing: 'refresh',
  verification_token_invalid: 'refresh',

  invalid_code: 'inline',
  invalid_assertion: 'inline',
  invalid_attestation: 'inline',
  passkey_ceremony_cancelled: 'inline',
  credential_already_enrolled: 'inline',
  email_claimed: 'inline',

  flow_expired: 'restart',
  invalid_flow: 'restart',
  too_many_attempts: 'restart',

  otp_resend_cooldown: 'cooldown',
  rate_limited: 'cooldown',

  max_passkeys_reached: 'failure',
  // The profile has paired as many wallets as it can: only support can help.
  max_identifiers_reached: 'support',
  multi_primary_srp: 'support',
  // Removal only, outside the flow: the settings page shows its own error.
  cross_type_step_up_required: 'failure',
  last_credential: 'failure',
  invalid_response: 'failure',
  invalid_request: 'failure',
  passkey_unsupported: 'failure',
  passkey_already_exists: 'failure',
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
 * Whether the code means a bug on our side (a malformed request or response)
 * rather than something the user or the server's rules caused.
 *
 * @param code - The flow error code.
 * @returns `true` for codes worth reporting.
 */
/**
 * Whether the failure screen offers to try again: trying again can work, for
 * example with another password manager.
 *
 * @param code - The flow error code.
 * @returns `true` when the user can retry.
 */
export const isRetryableFailure = (code: MfaFlowErrorCode): boolean =>
  code === 'passkey_already_exists';

export const isReportable = (code: MfaFlowErrorCode): boolean =>
  code === 'invalid_response' || code === 'invalid_request';

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

/**
 * Whether the email code screen shows the state's error as the countdown on
 * its resend button instead of as an error: a cooldown that came with a wait
 * time, also once that wait ended.
 *
 * @param state - The flow's state.
 * @param state.step - The screen shown.
 * @param state.error - The error, if any.
 * @param state.resendAvailableAt - When the next code may be requested.
 * @returns Whether the error is the countdown.
 */
export const isCooldownCountdown = ({
  step,
  error,
  resendAvailableAt,
}: MfaFlowState): boolean =>
  step.name === 'otp' &&
  step.method === 'email_otp' &&
  error !== undefined &&
  resendAvailableAt !== undefined &&
  getErrorHandling(error) === 'cooldown';
