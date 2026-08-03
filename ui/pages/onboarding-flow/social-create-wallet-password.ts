import type { SecretEscrowFactorKind } from '../../../shared/constants/secret-escrow-factors';

/**
 * Holds vault password + user-chosen factor state during social-create
 * unlock setup so passkey enroll / password add can run without re-prompting.
 *
 * Cleared when onboarding leaves the factor flow. Not persisted.
 */

let socialCreateWalletPassword: string | null = null;
const socialCreateUserFactors = new Set<SecretEscrowFactorKind>();

/**
 * Stores the current vault password for the social-create factor flow.
 *
 * @param password - Vault password (typed or generated).
 */
export function setSocialCreateWalletPassword(password: string): void {
  socialCreateWalletPassword = password;
}

/**
 * Returns the in-memory vault password for the social-create factor flow.
 *
 * @returns Password string, or null when unset.
 */
export function getSocialCreateWalletPassword(): string | null {
  return socialCreateWalletPassword;
}

/**
 * Marks a factor as user-chosen (shown as set up on the manage screen).
 *
 * @param factor - Factor kind the user completed setup for.
 */
export function markSocialCreateUserFactor(
  factor: SecretEscrowFactorKind,
): void {
  socialCreateUserFactors.add(factor);
}

/**
 * Factors the user has explicitly set up during social create.
 *
 * @returns Copy of enrolled factor kinds.
 */
export function getSocialCreateUserFactors(): SecretEscrowFactorKind[] {
  return [...socialCreateUserFactors];
}

/**
 * Clears the in-memory social-create vault password and factor marks.
 */
export function clearSocialCreateFactorSession(): void {
  socialCreateWalletPassword = null;
  socialCreateUserFactors.clear();
}
