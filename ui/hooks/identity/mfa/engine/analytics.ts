/* eslint-disable @typescript-eslint/naming-convention -- Segment properties and the server's codes are snake_case */
import { getFlowErrorCode } from './errors';
import type {
  MfaFlowErrorCode,
  MfaFlowRequest,
  MfaFlowState,
  MfaFlowStep,
  MfaReason,
} from './types';

/**
 * The kit's analytics events, named as in the Segment schema's
 * `metamask-mfa` library. Each client maps them to its own event registry.
 */
export const MFA_EVENTS = {
  flowStatusUpdated: 'MFA Flow Status Updated',
  stepViewed: 'MFA Step Viewed',
  errorViewed: 'MFA Error Viewed',
  errorCtaClicked: 'MFA Error CTA Clicked',
  methodSelected: 'MFA Method Selected',
  codeResent: 'MFA Code Resent',
} as const;

export type MfaEvent = (typeof MFA_EVENTS)[keyof typeof MFA_EVENTS];

export type MfaEventProperties = Record<string, string | boolean | string[]>;

/** Each client's way of sending an event, passed to `startMfaFlow`. */
export type MfaTrackEvent = (
  event: MfaEvent,
  properties: MfaEventProperties,
) => void;

export type MfaErrorCta = 'try_again' | 'learn_more' | 'contact_support';

const ENTRY_POINTS = new Set(['vba', 'ukyc', 'settings', 'qa']);

const STEP_NAMES: Record<Exclude<MfaFlowStep['name'], 'idle'>, string> = {
  intro: 'intro',
  picker: 'picker',
  emailEntry: 'email_entry',
  otp: 'otp',
  totpSetup: 'totp_setup',
  passkey: 'passkey',
  failure: 'failure',
};

/**
 * Codes grouped by what the user sees. Codes the kit handles without showing
 * them are not listed: one that reaches the failure screen is generic.
 */
const ERROR_TYPES: Partial<Record<MfaFlowErrorCode, string>> = {
  email_claimed: 'email_in_use',
  credential_already_enrolled: 'credential_in_use',
  multi_primary_srp: 'support_required',
  max_identifiers_reached: 'support_required',
  max_passkeys_reached: 'method_limit_reached',
  invalid_code: 'incorrect_code',
  flow_expired: 'code_expired',
  invalid_flow: 'code_expired',
  too_many_attempts: 'code_expired',
  otp_resend_cooldown: 'rate_limited',
  rate_limited: 'rate_limited',
  invalid_assertion: 'passkey_failed',
  invalid_attestation: 'passkey_failed',
  passkey_ceremony_cancelled: 'passkey_failed',
  passkey_unsupported: 'passkey_failed',
};

/**
 * The properties every event of a flow carries: the feature that opened the
 * kit and what it asked for.
 *
 * @param reason - The flow's reason.
 * @param request - The flow's request.
 * @returns The base properties.
 */
export const getBaseProperties = (
  reason: MfaReason,
  request: MfaFlowRequest,
): MfaEventProperties => {
  const prefix = reason.operation.split('.')[0];
  return {
    entry_point: ENTRY_POINTS.has(prefix) ? prefix : 'other',
    operation: reason.operation,
    flow_type: request.kind === 'enroll' ? 'enroll' : 'verify_or_enroll',
    methods_required:
      request.kind === 'enroll' ? [request.method] : request.methods,
  };
};

export const getErrorProperties = (
  code: MfaFlowErrorCode,
): MfaEventProperties => ({
  error_code: code,
  error_type: ERROR_TYPES[code] ?? 'generic_error',
});

/**
 * The screen a step shows: its name, and its purpose and method when it has
 * them. Nothing for `idle`, which shows no screen.
 *
 * @param step - The step.
 * @returns The screen's properties.
 */
export const getStepProperties = (step: MfaFlowStep): MfaEventProperties => {
  switch (step.name) {
    case 'idle':
      return {};
    case 'emailEntry':
      return { screen_name: STEP_NAMES[step.name], method: 'email_otp' };
    case 'totpSetup':
      return { screen_name: STEP_NAMES[step.name], method: 'totp' };
    case 'passkey':
      return {
        screen_name: STEP_NAMES[step.name],
        purpose: step.purpose,
        method: 'passkey',
      };
    case 'otp':
      return {
        screen_name: STEP_NAMES[step.name],
        purpose: step.purpose,
        method: step.method,
      };
    case 'picker':
      return { screen_name: STEP_NAMES[step.name], purpose: step.purpose };
    default:
      return { screen_name: STEP_NAMES[step.name] };
  }
};

export const getStepViewedProperties = (
  step: MfaFlowStep,
): MfaEventProperties => {
  if (step.name === 'intro') {
    return {
      ...getStepProperties(step),
      methods_offered: step.methods,
      methods_missing: step.missing,
    };
  }
  if (step.name === 'picker') {
    return { ...getStepProperties(step), methods_offered: step.options };
  }
  return getStepProperties(step);
};

/**
 * How a flow ended. Closing the failure screen rejects with the code shown,
 * so only leaving another screen is `cancelled`.
 *
 * @param error - The flow's rejection.
 * @param state - The flow's state when it ended.
 * @returns The end event's properties.
 */
export const getFlowEndProperties = (
  error: unknown,
  state: MfaFlowState,
): MfaEventProperties => {
  const code = getFlowErrorCode(error);
  if (code !== 'flow_cancelled') {
    return { status: 'failed', ...getErrorProperties(code) };
  }
  const { screen_name: screenName } = getStepProperties(state.step);
  return {
    status: 'cancelled',
    ...(screenName ? { screen_name: screenName } : {}),
    ...(state.error
      ? { error_type: getErrorProperties(state.error).error_type }
      : {}),
  };
};
