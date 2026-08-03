import {
  getAddableSecretEscrowFactorOptions,
  getAvailableSecretEscrowFactorOptions,
  getFirstSecretEscrowFactorOptions,
  isPasskeyFactor,
  isPasswordFactor,
  isTotpFactor,
  resolveEnrolledSecretEscrowFactors,
  SecretEscrowFactorKind,
  SecretEscrowFactorOptionId,
  SECRET_ESCROW_FACTOR_OPTIONS,
} from './secret-escrow-factors';

describe('secret-escrow-factors', () => {
  it('filters options by passkey availability', () => {
    expect(
      getAvailableSecretEscrowFactorOptions({ passkeyAvailable: false }).map(
        (option) => option.id,
      ),
    ).toStrictEqual([
      SecretEscrowFactorOptionId.Password,
      SecretEscrowFactorOptionId.Totp,
    ]);

    expect(
      getAvailableSecretEscrowFactorOptions({ passkeyAvailable: true }),
    ).toHaveLength(SECRET_ESCROW_FACTOR_OPTIONS.length);
  });

  it('exposes first-factor options without TOTP', () => {
    expect(
      getFirstSecretEscrowFactorOptions({ passkeyAvailable: true }).map(
        (option) => option.id,
      ),
    ).toStrictEqual([
      SecretEscrowFactorOptionId.Passkey,
      SecretEscrowFactorOptionId.Password,
    ]);
  });

  it('offers TOTP only after a local unlock factor is enrolled', () => {
    expect(
      getAddableSecretEscrowFactorOptions({ passkeyAvailable: true }, []).map(
        (option) => option.id,
      ),
    ).toStrictEqual([
      SecretEscrowFactorOptionId.Passkey,
      SecretEscrowFactorOptionId.Password,
    ]);

    expect(
      getAddableSecretEscrowFactorOptions({ passkeyAvailable: true }, [
        SecretEscrowFactorKind.Passkey,
      ]).map((option) => option.id),
    ).toStrictEqual([
      SecretEscrowFactorOptionId.Password,
      SecretEscrowFactorOptionId.Totp,
    ]);
  });

  it('resolves enrolled factors from escrow state and typed-password choice', () => {
    expect(
      resolveEnrolledSecretEscrowFactors({
        escrowFactors: {
          password: { type: 'password' },
          passkey: { type: 'webauthn', credentialId: 'cred' },
        },
        userChoseTypedPassword: false,
      }),
    ).toStrictEqual([SecretEscrowFactorKind.Passkey]);

    expect(
      resolveEnrolledSecretEscrowFactors({
        escrowFactors: {
          password: { type: 'password' },
          totp: { type: 'totp' },
        },
        userChoseTypedPassword: true,
      }),
    ).toStrictEqual([
      SecretEscrowFactorKind.Password,
      SecretEscrowFactorKind.Totp,
    ]);
  });

  it('identifies factor kinds', () => {
    expect(isPasskeyFactor(SecretEscrowFactorKind.Passkey)).toBe(true);
    expect(isPasswordFactor(SecretEscrowFactorKind.Password)).toBe(true);
    expect(isTotpFactor(SecretEscrowFactorKind.Totp)).toBe(true);
    expect(isPasskeyFactor(SecretEscrowFactorKind.Password)).toBe(false);
  });
});
