import { isAssetRequireActivate, isTrustlineAsset } from './trustline';

const CLASSIC_ASSET_ID =
  'stellar:pubnet/asset:USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
const SEP41_ASSET_ID =
  'stellar:pubnet/sep41:CBIJBDNZNF4X35BJ4FFZWCDBSCKOP5NB4PLG4SNENRMLAPYG4P5FM6VN';

describe('isTrustlineAsset', () => {
  it('returns true for a Stellar classic asset', () => {
    expect(isTrustlineAsset(CLASSIC_ASSET_ID)).toBe(true);
  });

  it('returns false for a Stellar SEP-41 asset', () => {
    expect(isTrustlineAsset(SEP41_ASSET_ID)).toBe(false);
  });

  it('returns false for a non-Stellar asset', () => {
    expect(
      isTrustlineAsset(
        'eip155:1/erc20:0x0000000000000000000000000000000000000000',
      ),
    ).toBe(false);
  });

  it('returns false for an empty or invalid assetId', () => {
    expect(isTrustlineAsset('')).toBe(false);
    expect(isTrustlineAsset('not-a-caip-asset-id')).toBe(false);
  });
});

describe('isAssetRequireActivate', () => {
  it('returns true for a classic asset with assetMetadata.limit === "0"', () => {
    expect(
      isAssetRequireActivate({
        assetId: CLASSIC_ASSET_ID,
        assetMetadata: { limit: '0' },
      }),
    ).toBe(true);
  });

  it('returns false for a classic asset with limit > 0', () => {
    expect(
      isAssetRequireActivate({
        assetId: CLASSIC_ASSET_ID,
        assetMetadata: { limit: '10' },
      }),
    ).toBe(false);
  });

  it('returns false for a SEP-41 asset regardless of limit', () => {
    expect(
      isAssetRequireActivate({
        assetId: SEP41_ASSET_ID,
        assetMetadata: { limit: '0' },
      }),
    ).toBe(false);
  });

  it('treats missing assetMetadata as inactive', () => {
    expect(
      isAssetRequireActivate({
        assetId: CLASSIC_ASSET_ID,
        assetMetadata: undefined,
      }),
    ).toBe(true);
  });

  it('treats a missing limit as inactive', () => {
    expect(
      isAssetRequireActivate({
        assetId: CLASSIC_ASSET_ID,
        assetMetadata: {},
      }),
    ).toBe(true);
  });

  it('returns false for a non-trustline asset regardless of assetMetadata', () => {
    expect(
      isAssetRequireActivate({
        assetId: 'eip155:1/erc20:0x0000000000000000000000000000000000000000',
        assetMetadata: { limit: '0' },
      }),
    ).toBe(false);
  });
});
