/**
 * Unlock factors for social-login secret escrow (1-of-N).
 *
 * Add new kinds here (e.g. `totp`) and corresponding picker options — the
 * onboarding UI reads {@link SECRET_ESCROW_FACTOR_OPTIONS}.
 */
export const SecretEscrowFactorKind = {
  Password: 'password',
  Passkey: 'passkey',
  // Totp: 'totp',
} as const;

export type SecretEscrowFactorKind =
  (typeof SecretEscrowFactorKind)[keyof typeof SecretEscrowFactorKind];

/**
 * Stable ids for onboarding factor presets (not the same as escrow factor ids).
 */
export const SecretEscrowFactorOptionId = {
  Passkey: 'passkey',
  Password: 'password',
  PasskeyAndPassword: 'passkey_and_password',
  // Totp: 'totp',
} as const;

export type SecretEscrowFactorOptionId =
  (typeof SecretEscrowFactorOptionId)[keyof typeof SecretEscrowFactorOptionId];

export type SecretEscrowFactorOptionAvailability = {
  passkeyAvailable: boolean;
};

export type SecretEscrowFactorOption = {
  id: SecretEscrowFactorOptionId;
  /** Escrow factors enrolled for this choice (1-of-N). */
  factors: readonly SecretEscrowFactorKind[];
  titleKey: string;
  descriptionKey: string;
  available: (context: SecretEscrowFactorOptionAvailability) => boolean;
};

/**
 * Ordered onboarding choices for social-create unlock factors.
 *
 * Future factors (TOTP, etc.) should be appended here with availability gates.
 */
export const SECRET_ESCROW_FACTOR_OPTIONS: readonly SecretEscrowFactorOption[] =
  [
    {
      id: SecretEscrowFactorOptionId.Passkey,
      factors: [SecretEscrowFactorKind.Passkey],
      titleKey: 'secretEscrowFactorPasskeyTitle',
      descriptionKey: 'secretEscrowFactorPasskeyDescription',
      available: ({ passkeyAvailable }) => passkeyAvailable,
    },
    {
      id: SecretEscrowFactorOptionId.Password,
      factors: [SecretEscrowFactorKind.Password],
      titleKey: 'secretEscrowFactorPasswordTitle',
      descriptionKey: 'secretEscrowFactorPasswordDescription',
      available: () => true,
    },
    {
      id: SecretEscrowFactorOptionId.PasskeyAndPassword,
      factors: [
        SecretEscrowFactorKind.Password,
        SecretEscrowFactorKind.Passkey,
      ],
      titleKey: 'secretEscrowFactorPasskeyAndPasswordTitle',
      descriptionKey: 'secretEscrowFactorPasskeyAndPasswordDescription',
      available: ({ passkeyAvailable }) => passkeyAvailable,
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
 * Whether the selection includes a passkey factor.
 *
 * @param factors - Selected escrow factor kinds.
 * @returns True when passkey is included.
 */
export function selectionIncludesPasskey(
  factors: readonly SecretEscrowFactorKind[],
): boolean {
  return factors.includes(SecretEscrowFactorKind.Passkey);
}

/**
 * Whether the selection includes a password factor the user must know.
 *
 * @param factors - Selected escrow factor kinds.
 * @returns True when password is included.
 */
export function selectionIncludesPassword(
  factors: readonly SecretEscrowFactorKind[],
): boolean {
  return factors.includes(SecretEscrowFactorKind.Password);
}

/**
 * Whether onboarding should prompt the user to type a password.
 *
 * Passkey-only uses a generated vault password instead.
 *
 * @param factors - Selected escrow factor kinds.
 * @returns True when the create-password form should be shown.
 */
export function selectionRequiresTypedPassword(
  factors: readonly SecretEscrowFactorKind[],
): boolean {
  return selectionIncludesPassword(factors);
}
