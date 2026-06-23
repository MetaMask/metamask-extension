import { isStellarClassicTrustlineInactiveForDisplay } from './trustline-from-extra';

describe('isStellarClassicTrustlineInactiveForDisplay', () => {
  const classicUsdc =
    'stellar:pubnet/asset:USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
  const sep41SolvBtc =
    'stellar:pubnet/sep41:CBIJBDNZNF4X35BJ4FFZWCDBSCKOP5NB4PLG4SNENRMLAPYG4P5FM6VN';

  it('returns false for native XLM without extra', () => {
    expect(
      isStellarClassicTrustlineInactiveForDisplay({
        chainId: 'stellar:pubnet',
        assetId: 'stellar:pubnet/slip44:148',
        isNative: true,
      }),
    ).toBe(false);
  });

  it('returns false for sep41 tokens without extra', () => {
    expect(
      isStellarClassicTrustlineInactiveForDisplay({
        chainId: 'stellar:pubnet',
        assetId: sep41SolvBtc,
      }),
    ).toBe(false);
  });

  it('returns true for classic asset with zero limit extra', () => {
    expect(
      isStellarClassicTrustlineInactiveForDisplay({
        chainId: 'stellar:pubnet',
        assetId: classicUsdc,
        extra: { limit: '0' },
      }),
    ).toBe(true);
  });

  it('returns true for classic asset without extra on first import', () => {
    expect(
      isStellarClassicTrustlineInactiveForDisplay({
        chainId: 'stellar:pubnet',
        assetId: classicUsdc,
      }),
    ).toBe(true);
  });

  it('returns false for non-stellar chains', () => {
    expect(
      isStellarClassicTrustlineInactiveForDisplay({
        chainId: '0x1',
        assetId: '0x123',
      }),
    ).toBe(false);
  });
});
