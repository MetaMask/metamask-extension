import { submitRequestToBackground } from '../../../store/background-connection';
import type { MfaControllerAdapter } from './engine/types';

const callAuthenticationController =
  <Method extends keyof MfaControllerAdapter>(method: Method) =>
  (...args: Parameters<MfaControllerAdapter[Method]>) =>
    submitRequestToBackground<
      Awaited<ReturnType<MfaControllerAdapter[Method]>>
    >('messengerCall', [`AuthenticationController:${method}`, args]);

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
