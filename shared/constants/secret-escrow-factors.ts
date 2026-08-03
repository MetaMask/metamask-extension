/**
 * Unlock factors for social-login secret escrow (1-of-N).
 *
 * Each onboarding option maps to a **single** factor. Users pick one first,
 * then can add more from the manage screen. Append new kinds (e.g. `totp`)
 * here and in {@link SECRET_ESCROW_FACTOR_OPTIONS}.
 */
export const SecretEscrowFactorKind = {
  Password: 'password',
  Passkey: 'passkey',
  // Totp: 'totp',
} as const;

export type SecretEscrowFactorKind =
  (typeof SecretEscrowFactorKind)[keyof typeof SecretEscrowFactorKind];

/**
 * Stable ids for single-factor onboarding options.
 */
export const SecretEscrowFactorOptionId = {
  Passkey: 'passkey',
  Password: 'password',
  // Totp: 'totp',
} as const;

export type SecretEscrowFactorOptionId =
  (typeof SecretEscrowFactorOptionId)[keyof typeof SecretEscrowFactorOptionId];

export type SecretEscrowFactorOptionAvailability = {
  passkeyAvailable: boolean;
};

export type SecretEscrowFactorOption = {
  id: SecretEscrowFactorOptionId;
  /** Single escrow factor kind for this option. */
  factor: SecretEscrowFactorKind;
  titleKey: string;
  descriptionKey: string;
  available: (context: SecretEscrowFactorOptionAvailability) => boolean;
};

/**
 * Ordered single-factor choices for social-create unlock setup.
 *
 * Future factors (TOTP, etc.) should be appended here with availability gates.
 */
export const SECRET_ESCROW_FACTOR_OPTIONS: readonly SecretEscrowFactorOption[] =
  [
    {
      id: SecretEscrowFactorOptionId.Passkey,
      factor: SecretEscrowFactorKind.Passkey,
      titleKey: 'secretEscrowFactorPasskeyTitle',
      descriptionKey: 'secretEscrowFactorPasskeyDescription',
      available: ({ passkeyAvailable }) => passkeyAvailable,
    },
    {
      id: SecretEscrowFactorOptionId.Password,
      factor: SecretEscrowFactorKind.Password,
      titleKey: 'secretEscrowFactorPasswordTitle',
      descriptionKey: 'secretEscrowFactorPasswordDescription',
      available: () => true,
    },
  ];

/**
 * Returns picker options available in the current client environment.
 *
 * @param context - Availability flags (WebAuthn / feature gates).
 * @returns Filtered option list.
 */
export function getAvailableSecretEscrowFactorOptions(
  context: SecretEscrowFactorOptionAvailability,
): SecretEscrowFactorOption[] {
  return SECRET_ESCROW_FACTOR_OPTIONS.filter((option) =>
    option.available(context),
  );
}

/**
 * Options not yet enrolled, available to add.
 *
 * @param context - Availability flags.
 * @param enrolledFactorIds - Factor kinds the user has set up.
 * @returns Options the user can still set up.
 */
export function getAddableSecretEscrowFactorOptions(
  context: SecretEscrowFactorOptionAvailability,
  enrolledFactorIds: readonly SecretEscrowFactorKind[],
): SecretEscrowFactorOption[] {
  const enrolled = new Set(enrolledFactorIds);
  return getAvailableSecretEscrowFactorOptions(context).filter(
    (option) => !enrolled.has(option.factor),
  );
}

/**
 * Whether the factor kind is passkey.
 *
 * @param factor - Escrow factor kind.
 * @returns True when passkey.
 */
export function isPasskeyFactor(factor: SecretEscrowFactorKind): boolean {
  return factor === SecretEscrowFactorKind.Passkey;
}

/**
 * Whether the factor kind is a user-typed password.
 *
 * @param factor - Escrow factor kind.
 * @returns True when password.
 */
export function isPasswordFactor(factor: SecretEscrowFactorKind): boolean {
  return factor === SecretEscrowFactorKind.Password;
}
