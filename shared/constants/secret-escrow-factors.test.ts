import {
  getAvailableSecretEscrowFactorOptions,
  selectionIncludesPasskey,
  selectionIncludesPassword,
  selectionRequiresTypedPassword,
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

  it('derives password / passkey requirements from factor sets', () => {
    expect(selectionIncludesPasskey([SecretEscrowFactorKind.Passkey])).toBe(
      true,
    );
    expect(selectionIncludesPassword([SecretEscrowFactorKind.Password])).toBe(
      true,
    );
    expect(
      selectionRequiresTypedPassword([SecretEscrowFactorKind.Passkey]),
    ).toBe(false);
    expect(
      selectionRequiresTypedPassword([
        SecretEscrowFactorKind.Password,
        SecretEscrowFactorKind.Passkey,
      ]),
    ).toBe(true);
  });
});
