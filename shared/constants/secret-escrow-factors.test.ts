import {
  getAddableSecretEscrowFactorOptions,
  getAvailableSecretEscrowFactorOptions,
  isPasskeyFactor,
  isPasswordFactor,
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
    ).toStrictEqual([SecretEscrowFactorOptionId.Password]);

    expect(
      getAvailableSecretEscrowFactorOptions({ passkeyAvailable: true }),
    ).toHaveLength(SECRET_ESCROW_FACTOR_OPTIONS.length);
  });

  it('exposes only single-factor options', () => {
    expect(
      SECRET_ESCROW_FACTOR_OPTIONS.map((option) => option.id),
    ).toStrictEqual([
      SecretEscrowFactorOptionId.Passkey,
      SecretEscrowFactorOptionId.Password,
    ]);
  });

  it('filters addable options by enrolled factors', () => {
    expect(
      getAddableSecretEscrowFactorOptions({ passkeyAvailable: true }, [
        SecretEscrowFactorKind.Passkey,
      ]).map((option) => option.id),
    ).toStrictEqual([SecretEscrowFactorOptionId.Password]);
  });

  it('identifies factor kinds', () => {
    expect(isPasskeyFactor(SecretEscrowFactorKind.Passkey)).toBe(true);
    expect(isPasswordFactor(SecretEscrowFactorKind.Password)).toBe(true);
    expect(isPasskeyFactor(SecretEscrowFactorKind.Password)).toBe(false);
  });
});
