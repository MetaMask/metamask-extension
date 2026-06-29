import { XlmScope } from '@metamask/keyring-api';
import { isStellarClassicTrustlineInactiveForDisplay } from './trustline-from-account-asset-info';

describe('isStellarClassicTrustlineInactiveForDisplay', () => {
  it('returns true for classic asset with accountAssetInfo.limit === "0"', () => {
    expect(
      isStellarClassicTrustlineInactiveForDisplay({
        chainId: XlmScope.Pubnet,
        assetId:
          'stellar:pubnet/asset:USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
        isNative: false,
        accountAssetInfo: { limit: '0' },
        balance: '0',
      }),
    ).toBe(true);
  });

  it('returns false for classic asset with limit > 0', () => {
    expect(
      isStellarClassicTrustlineInactiveForDisplay({
        chainId: XlmScope.Pubnet,
        assetId:
          'stellar:pubnet/asset:USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
        isNative: false,
        accountAssetInfo: { limit: '10' },
        balance: '10',
      }),
    ).toBe(false);
  });

  it('returns false for SEP-41 asset regardless of limit', () => {
    expect(
      isStellarClassicTrustlineInactiveForDisplay({
        chainId: XlmScope.Pubnet,
        assetId:
          'stellar:pubnet/sep41:CBIJBDNZNF4X35BJ4FFZWCDBSCKOP5NB4PLG4SNENRMLAPYG4P5FM6VN',
        isNative: false,
        accountAssetInfo: { limit: '0' },
        balance: '0',
      }),
    ).toBe(false);
  });

  it('treats missing accountAssetInfo as inactive when balance missing or zero', () => {
    expect(
      isStellarClassicTrustlineInactiveForDisplay({
        chainId: XlmScope.Pubnet,
        assetId:
          'stellar:pubnet/asset:FOO-GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        isNative: false,
        accountAssetInfo: undefined,
        balance: undefined,
      }),
    ).toBe(true);
  });

  it('treats invalid limit as inactive', () => {
    expect(
      isStellarClassicTrustlineInactiveForDisplay({
        chainId: XlmScope.Pubnet,
        assetId:
          'stellar:pubnet/asset:FOO-GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        isNative: false,
        accountAssetInfo: { limit: 'not-a-number' } as any,
        balance: '0',
      }),
    ).toBe(true);
  });
});
