// This MFA engine is kept identical to metamask-mobile's
// (app/util/identity/mfa/engine) so both clients behave the same, so it
// follows mobile's convention of interfaces over types.
/* eslint-disable @typescript-eslint/consistent-type-definitions */

// Our SDK's WebAuthn types have the same names as the browser's built-in
// ones; these imports are the ones we want.
/* eslint-disable @typescript-eslint/no-shadow */
import type {
  AuthenticationResponseJSON,
  BeginEnrollmentRequest,
  BeginVerificationRequest,
  CompleteEnrollmentRequest,
  CompleteVerificationRequest,
  EnrolledCredential,
  EnrollmentChallenge,
  GetVerificationTokenRequest,
  MfaCredentialType,
  MfaErrorCode,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
  VerificationChallenge,
  VerificationToken,
} from '@metamask/profile-sync-controller/sdk';
/* eslint-enable @typescript-eslint/no-shadow */

export type MfaMethod = MfaCredentialType;

export type MfaPlatform = 'mobile' | 'extension';

/**
 * What the kit knows about one method for the current profile and platform.
 */
export interface MethodStatus {
  method: MfaMethod;
  /** Listed by the server with `status: active`, provider-backed email included. */
  isActive: boolean;
  /** Active, and this platform can run the verification ceremony. */
  canVerify: boolean;
  /** This platform can run the setup ceremony and the server would accept it. */
  canEnroll: boolean;
  /**
   * Identifier of a setup that was started but never confirmed (the email
   * address for `email_otp`).
   */
  pendingIdentifier?: string;
  /** Rows of this type, as returned by the server. */
  credentials: EnrolledCredential[];
}

export type MethodStatuses = Record<MfaMethod, MethodStatus>;

/**
 * The live verification session, as returned by `getVerificationToken()`.
 */
export type SessionSnapshot = Pick<VerificationToken, 'obtainedAt'> & {
  amr: VerificationToken['claims']['amr'];
};

/**
 * - `refresh`: the client's view of the profile was stale; refresh the
 * credentials and re-plan, once per step.
 * - `inline`: the user can fix it on the same step.
 * - `restart`: the server-side challenge is gone; the step needs a new one.
 * - `cooldown`: the server is rate limiting; wait before the next request.
 * - `failure`: the flow ends on the failure screen, or rejects upfront if
 * nothing was shown.
 * - `transient`: a server or network error; the user can try again.
 */
export type MfaErrorHandling =
  | 'refresh'
  | 'inline'
  | 'restart'
  | 'cooldown'
  | 'failure'
  | 'transient';

/**
 * Codes the kit itself rejects with, on top of the controller's `MfaErrorCode`.
 */
export type MfaKitErrorCode =
  | 'flow_cancelled'
  | 'flow_in_progress'
  | 'passkey_unsupported'
  | 'passkey_ceremony_cancelled'
  | 'invalid_request'
  | 'email_already_enrolled';

/**
 * Every code `verifyOrEnroll` and `enroll` can reject with, as read by
 * `getMfaErrorCode()`.
 */
export type MfaFlowErrorCode = MfaErrorCode | MfaKitErrorCode;

export interface MfaReason {
  /** Sent to the controller (trace tags). */
  operation: string;
  /** Already-translated line explaining why the feature asks. UI only. */
  description?: string;
}

/**
 * Each client's implementation of the platform passkey sheet.
 */
export interface PasskeyAdapter {
  create: (
    options: PublicKeyCredentialCreationOptionsJSON,
  ) => Promise<RegistrationResponseJSON>;
  get: (
    options: PublicKeyCredentialRequestOptionsJSON,
  ) => Promise<AuthenticationResponseJSON>;
}

/**
 * Each client's way of calling the AuthenticationController. Every call is
 * asynchronous, because the extension reaches the controller through its
 * background.
 */
export interface MfaControllerAdapter {
  refreshEnrolledCredentials: () => Promise<EnrolledCredential[]>;
  beginCredentialEnrollment: (
    request: BeginEnrollmentRequest,
  ) => Promise<EnrollmentChallenge>;
  completeCredentialEnrollment: (
    request: CompleteEnrollmentRequest,
  ) => Promise<EnrolledCredential[]>;
  beginCredentialVerification: (
    request: BeginVerificationRequest,
  ) => Promise<VerificationChallenge>;
  completeCredentialVerification: (
    request: CompleteVerificationRequest,
  ) => Promise<VerificationToken>;
  getVerificationToken: (
    request?: GetVerificationTokenRequest,
  ) => Promise<VerificationToken | null>;
  clearVerificationSession: () => Promise<void>;
}

export interface VerifyOrEnrollRequest {
  /** Methods that must be active. Missing ones are set up in the flow. */
  methods: MfaMethod[];
  /** Methods, all within `methods`, that may prove it's the user now. */
  verifyWith?: MfaMethod | MfaMethod[];
  /** Tightens how old a reused verification may be. */
  maxSessionAgeMs?: number;
}

export type VerifyOrEnrollOptions = VerifyOrEnrollRequest & {
  reason: MfaReason;
};

export interface EnrollOptions {
  method: MfaMethod;
  reason: MfaReason;
}

export type PlanStep =
  | { kind: 'intro'; missing: MfaMethod[] }
  | { kind: 'confirm'; options: MfaMethod[] }
  | { kind: 'setup'; method: MfaMethod; prefillEmail?: string }
  | { kind: 'verify'; options: MfaMethod[] };

export type Plan =
  | { ok: true; steps: PlanStep[] }
  | { ok: false; code: MfaKitErrorCode };

export interface PlanContext {
  platform: MfaPlatform;
  credentials: EnrolledCredential[];
  /** From `getVerificationToken()` with no age limit, or `null`. */
  session: SessionSnapshot | null;
  flowStartedAt: number;
  now: number;
  /** The intro was already shown in this flow. */
  introShown: boolean;
}

export type MfaFlowRequest =
  | ({ kind: 'verifyOrEnroll' } & VerifyOrEnrollRequest)
  | { kind: 'enroll'; method: MfaMethod };

export type MfaPurpose = 'setup' | 'confirm' | 'verify';

export type MfaFlowStep =
  | { name: 'idle' }
  | { name: 'intro'; missing: MfaMethod[] }
  | {
      name: 'picker';
      purpose: Exclude<MfaPurpose, 'setup'>;
      options: MfaMethod[];
    }
  | { name: 'emailEntry'; prefillEmail?: string }
  | { name: 'otp'; purpose: MfaPurpose; email?: string; codeSent: boolean }
  | { name: 'passkey'; purpose: MfaPurpose }
  | { name: 'success' }
  | { name: 'failure'; code: MfaFlowErrorCode; canRetry: boolean };

export interface MfaFlowState {
  step: MfaFlowStep;
  busy: boolean;
  /** Code of an error to show on the current screen. */
  error?: MfaFlowErrorCode;
  /** A new code was sent without the user asking (expired flow). */
  codeResent?: boolean;
  /** When the next code may be requested. */
  resendAvailableAt?: number;
  /** Setup progress: the method being set up, out of all set up in the flow. */
  progress: { current: number; total: number };
}

export type MfaFlowAction =
  | { type: 'continue' }
  | { type: 'choose'; method: MfaMethod }
  | { type: 'submitEmail'; email: string }
  | { type: 'submitCode'; code: string }
  | { type: 'resend' }
  | { type: 'retry' }
  | { type: 'dismiss' }
  | { type: 'cancel' };

export interface MfaFlowResult {
  credentials: EnrolledCredential[];
  token?: VerificationToken;
}

export interface MfaFlowOptions {
  request: MfaFlowRequest;
  reason: MfaReason;
  platform: MfaPlatform;
  controller: MfaControllerAdapter;
  passkey?: PasskeyAdapter;
  now?: () => number;
}

export interface MfaFlow {
  readonly reason: MfaReason;
  readonly result: Promise<MfaFlowResult>;
  start: () => Promise<void>;
  getState: () => MfaFlowState;
  subscribe: (listener: () => void) => () => void;
  dispatch: (action: MfaFlowAction) => void;
}
