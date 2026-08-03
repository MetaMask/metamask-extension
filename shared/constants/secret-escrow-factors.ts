/**
 * Unlock factors for social-login secret escrow (1-of-N).
 *
 * Each onboarding option maps to a **single** factor. Users pick one
 * local-capable factor first (passkey / password), then can add more —
 * including backend-assisted factors like TOTP — from the manage screen.
 */
export const SecretEscrowFactorKind = {
  Password: 'password',
  Passkey: 'passkey',
  Totp: 'totp',
} as const;

export type SecretEscrowFactorKind =
  (typeof SecretEscrowFactorKind)[keyof typeof SecretEscrowFactorKind];

/**
 * Stable ids for single-factor onboarding options.
 */
export const SecretEscrowFactorOptionId = {
  Passkey: 'passkey',
  Password: 'password',
  Totp: 'totp',
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
  /**
   * Whether this factor can unlock the vault locally without the escrow
   * backend (password / passkey). TOTP requires the backend to release `S`.
   */
  canUnlockLocally: boolean;
  available: (context: SecretEscrowFactorOptionAvailability) => boolean;
};

/**
 * Ordered single-factor choices for social-create unlock setup.
 *
 * TOTP is listed for manage/add flows only — see
 * {@link getFirstSecretEscrowFactorOptions}.
 */
export const SECRET_ESCROW_FACTOR_OPTIONS: readonly SecretEscrowFactorOption[] =
  [
    {
      id: SecretEscrowFactorOptionId.Passkey,
      factor: SecretEscrowFactorKind.Passkey,
      titleKey: 'secretEscrowFactorPasskeyTitle',
      descriptionKey: 'secretEscrowFactorPasskeyDescription',
      canUnlockLocally: true,
      available: ({ passkeyAvailable }) => passkeyAvailable,
    },
    {
      id: SecretEscrowFactorOptionId.Password,
      factor: SecretEscrowFactorKind.Password,
      titleKey: 'secretEscrowFactorPasswordTitle',
      descriptionKey: 'secretEscrowFactorPasswordDescription',
      canUnlockLocally: true,
      available: () => true,
    },
    {
      id: SecretEscrowFactorOptionId.Totp,
      factor: SecretEscrowFactorKind.Totp,
      titleKey: 'secretEscrowFactorTotpTitle',
      descriptionKey: 'secretEscrowFactorTotpDescription',
      canUnlockLocally: false,
      available: () => true,
    },
  ];

const FACTOR_TITLE_KEYS: Record<SecretEscrowFactorKind, string> = {
  [SecretEscrowFactorKind.Passkey]: 'secretEscrowFactorPasskeyTitle',
  [SecretEscrowFactorKind.Password]: 'secretEscrowFactorPasswordTitle',
  [SecretEscrowFactorKind.Totp]: 'secretEscrowFactorTotpTitle',
};

/**
 * i18n title key for an enrolled factor kind.
 *
 * @param factor - Factor kind.
 * @returns Locale message key.
 */
export function getSecretEscrowFactorTitleKey(
  factor: SecretEscrowFactorKind,
): string {
  return FACTOR_TITLE_KEYS[factor];
}

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
 * First-factor choices that can unlock the vault locally.
 *
 * Excludes backend-only factors such as TOTP.
 *
 * @param context - Availability flags.
 * @returns Options safe to enroll as the first unlock method.
 */
export function getFirstSecretEscrowFactorOptions(
  context: SecretEscrowFactorOptionAvailability,
): SecretEscrowFactorOption[] {
  return getAvailableSecretEscrowFactorOptions(context).filter(
    (option) => option.canUnlockLocally,
  );
}

/**
 * Options not yet enrolled, available to add from the manage screen.
 *
 * Backend-only factors (TOTP) appear only after at least one local unlock
 * factor is enrolled.
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
  const hasLocalUnlock = [...enrolled].some((factor) => {
    const option = SECRET_ESCROW_FACTOR_OPTIONS.find(
      (entry) => entry.factor === factor,
    );
    return option?.canUnlockLocally;
  });

  return getAvailableSecretEscrowFactorOptions(context).filter((option) => {
    if (enrolled.has(option.factor)) {
      return false;
    }
    if (!option.canUnlockLocally && !hasLocalUnlock) {
      return false;
    }
    return true;
  });
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

/**
 * Whether the factor kind is TOTP.
 *
 * @param factor - Escrow factor kind.
 * @returns True when TOTP.
 */
export function isTotpFactor(factor: SecretEscrowFactorKind): boolean {
  return factor === SecretEscrowFactorKind.Totp;
}

export type EscrowFactorPublicLike = {
  type?: string;
  credentialId?: string;
};

/**
 * Resolves which factors to show as "set up" on the manage screen.
 *
 * Passkey / TOTP come from escrow public state. Password is included only when
 * the user explicitly chose a typed password (passkey-first registers a
 * technical password factor that must stay hidden).
 *
 * @param params - Escrow factors + session password choice.
 * @param params.escrowFactors - Public factors map from controller state.
 * @param params.userChoseTypedPassword - True when the user set a known password.
 * @returns Ordered enrolled factor kinds for the UI.
 */
export function resolveEnrolledSecretEscrowFactors(params: {
  escrowFactors: Record<string, EscrowFactorPublicLike>;
  userChoseTypedPassword: boolean;
}): SecretEscrowFactorKind[] {
  const enrolled: SecretEscrowFactorKind[] = [];
  const values = Object.values(params.escrowFactors);

  const hasPasskey = values.some(
    (factor) =>
      factor?.type === 'webauthn' || Boolean(factor?.credentialId),
  );
  if (hasPasskey || params.escrowFactors.passkey) {
    enrolled.push(SecretEscrowFactorKind.Passkey);
  }

  if (params.userChoseTypedPassword) {
    enrolled.push(SecretEscrowFactorKind.Password);
  }

  const hasTotp = values.some((factor) => factor?.type === 'totp');
  if (hasTotp || params.escrowFactors.totp) {
    enrolled.push(SecretEscrowFactorKind.Totp);
  }

  return enrolled;
}
