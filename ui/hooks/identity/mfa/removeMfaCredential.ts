import type {
  EnrolledCredential,
  TokenReason,
} from '@metamask/profile-sync-controller/sdk';
import { submitRequestToBackground } from '../../../store/background-connection';

/**
 * Removes one of the profile's methods and caches the ones left. It needs a
 * verification from `verifyOrEnroll` with another type of method: the server
 * refuses one with the same type, and the last method.
 *
 * @param credential - The method to remove.
 * @param reason - The operation, for tracing.
 */
export const removeMfaCredential = async (
  credential: EnrolledCredential,
  reason: TokenReason,
): Promise<void> => {
  await submitRequestToBackground<EnrolledCredential[]>('messengerCall', [
    'AuthenticationController:removeCredential',
    [{ credentialId: credential.id, reason }],
  ]);
};
