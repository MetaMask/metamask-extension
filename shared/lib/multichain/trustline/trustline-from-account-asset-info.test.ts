import { XlmScope } from '@metamask/keyring-api';
import { isClassicTrustlineInactiveForDisplay } from './trustline-from-account-asset-info';

describe('isClassicTrustlineInactiveForDisplay', () => {
  it('returns true for classic asset with accountAssetInfo.limit === "0"', () => {
    expect(
      isClassicTrustlineInactiveForDisplay({
        chainId: XlmScope.Pubnet,
        assetId:
          'stellar:pubnet/asset:USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
        accountAssetInfo: { limit: '0' },
        balance: '0',
      }),
    ).toBe(true);
  });

  it('returns false for classic asset with limit > 0', () => {
    expect(
      isClassicTrustlineInactiveForDisplay({
        chainId: XlmScope.Pubnet,
        assetId:
          'stellar:pubnet/asset:USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
        accountAssetInfo: { limit: '10' },
        balance: '10',
      }),
    ).toBe(false);
  });

  it('returns false for SEP-41 asset regardless of limit', () => {
    expect(
      isClassicTrustlineInactiveForDisplay({
        chainId: XlmScope.Pubnet,
        assetId:
          'stellar:pubnet/sep41:CBIJBDNZNF4X35BJ4FFZWCDBSCKOP5NB4PLG4SNENRMLAPYG4P5FM6VN',
        accountAssetInfo: { limit: '0' },
        balance: '0',
      }),
    ).toBe(false);
  });

  it('treats missing accountAssetInfo as inactive when balance missing or zero', () => {
    expect(
      isClassicTrustlineInactiveForDisplay({
        chainId: XlmScope.Pubnet,
        assetId:
          'stellar:pubnet/asset:FOO-GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        accountAssetInfo: undefined,
        balance: undefined,
      }),
    ).toBe(true);
  });

  it('treats invalid limit as inactive', () => {
    expect(
      isClassicTrustlineInactiveForDisplay({
        chainId: XlmScope.Pubnet,
        assetId:
          'stellar:pubnet/asset:FOO-GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        accountAssetInfo: { limit: 'not-a-number' } as unknown as {
          limit?: string;
        },
        balance: '0',
      }),
    ).toBe(true);
  });
});
