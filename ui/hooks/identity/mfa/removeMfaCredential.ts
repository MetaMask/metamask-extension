import type {
  EnrolledCredential,
  VerificationToken,
} from '@metamask/profile-sync-controller/sdk';

/**
 * Removes one of the profile's methods, with a fresh verification token
 * proven with another one. The server and `AuthenticationController` don't
 * offer removal yet, so for now it always rejects.
 *
 * @param _credential - The method to remove.
 * @param _token - A verification token from `verifyOrEnroll`.
 */
export const removeMfaCredential = async (
  _credential: EnrolledCredential,
  _token?: VerificationToken,
): Promise<void> => {
  throw new Error('Removing MFA methods is not supported yet');
};
