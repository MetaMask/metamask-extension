import type {
  GetVerificationTokenRequest,
  VerificationToken,
} from '@metamask/profile-sync-controller/sdk';
import { submitRequestToBackground } from '../../../store/background-connection';
import { MfaFlowError } from './engine/errors';
import type { MfaControllerAdapter } from './engine/types';

/**
 * Calls an AuthenticationController action through the background.
 *
 * @param action - The controller method name, as in
 * `AuthenticationController:<action>`.
 * @returns A function that sends the call and resolves with its result.
 */
const callAction =
  <Result, Args extends unknown[]>(action: string) =>
  (...args: Args) =>
    submitRequestToBackground<Result>('messengerCall', [
      `AuthenticationController:${action}`,
      args,
    ]);

const callAuthenticationController = <
  Method extends keyof MfaControllerAdapter,
>(
  method: Method,
) =>
  callAction<
    Awaited<ReturnType<MfaControllerAdapter[Method]>>,
    Parameters<MfaControllerAdapter[Method]>
  >(method);

const callSocialLoginController = <Method extends keyof MfaControllerAdapter>(
  method: Method,
  action: SocialLoginAction,
) =>
  callAction<
    Awaited<ReturnType<MfaControllerAdapter[Method]>>,
    Parameters<MfaControllerAdapter[Method]>
  >(action);

type SocialLoginAction =
  | 'refreshSocialLoginCredentials'
  | 'beginSocialLoginVerification'
  | 'completeSocialLoginVerification';

export const extensionMfaControllerAdapter: MfaControllerAdapter = {
  refreshEnrolledCredentials: callAuthenticationController(
    'refreshEnrolledCredentials',
  ),
  beginCredentialEnrollment: callAuthenticationController(
    'beginCredentialEnrollment',
  ),
  completeCredentialEnrollment: callAuthenticationController(
    'completeCredentialEnrollment',
  ),
  beginCredentialVerification: callAuthenticationController(
    'beginCredentialVerification',
  ),
  completeCredentialVerification: callAuthenticationController(
    'completeCredentialVerification',
  ),
  getVerificationToken: callAuthenticationController('getVerificationToken'),
  clearVerificationSession: callAuthenticationController(
    'clearVerificationSession',
  ),
};

const rejectEnrollment = () =>
  Promise.reject(new MfaFlowError('invalid_request'));

/**
 * Holds the verification token a flow earns while the wallet is locked, in
 * memory only. The controller opens no session then, but the flow asks for the
 * token after each proof to know whether it is done: without one it would
 * start the verification again and send a new code.
 *
 * @returns The cache, with the same expiry rules as the controller's session.
 */
const createVerificationTokenCache = () => {
  let token: VerificationToken | null = null;
  return {
    remember: (value: VerificationToken) => {
      token = value;
      return value;
    },
    get: ({ maxSessionAgeMs }: GetVerificationTokenRequest = {}) => {
      if (!token) {
        return null;
      }
      const now = Date.now();
      if (now >= token.obtainedAt + token.expiresIn * 1000) {
        return null;
      }
      // `>=` so a zero max age always forces a fresh verification.
      if (
        maxSessionAgeMs !== undefined &&
        now - token.obtainedAt >= maxSessionAgeMs
      ) {
        return null;
      }
      return token;
    },
    clear: () => {
      token = null;
    },
  };
};

/**
 * Creates the adapter for a wallet that is still locked (social-login wallet
 * recovery). The controller's locked-only methods fetch the social token
 * themselves and never store a verification session, so the adapter keeps the
 * token of its own flow in memory: create one per flow. Enrolling is not
 * allowed there and the flow never plans it, so those calls reject.
 *
 * @returns A new adapter with an empty token cache.
 */
export const createSocialLoginControllerAdapter = (): MfaControllerAdapter => {
  const cache = createVerificationTokenCache();
  const completeVerification = callSocialLoginController(
    'completeCredentialVerification',
    'completeSocialLoginVerification',
  );
  return {
    refreshEnrolledCredentials: callSocialLoginController(
      'refreshEnrolledCredentials',
      'refreshSocialLoginCredentials',
    ),
    beginCredentialEnrollment: rejectEnrollment,
    completeCredentialEnrollment: rejectEnrollment,
    beginCredentialVerification: callSocialLoginController(
      'beginCredentialVerification',
      'beginSocialLoginVerification',
    ),
    completeCredentialVerification: async (request) =>
      cache.remember(await completeVerification(request)),
    getVerificationToken: async (request) => cache.get(request),
    clearVerificationSession: async () => cache.clear(),
  };
};
