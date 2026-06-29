import { XlmScope } from '@metamask/keyring-api';
import { AssetType } from '../../../constants/transaction';
import { getTrustlineAssetPageState } from './get-trustline-asset-page-state';

describe('getTrustlineAssetPageState', () => {
  it('returns falsey trustline flags for non-token types', () => {
    const state = getTrustlineAssetPageState({
      chainId: XlmScope.Pubnet,
      assetId: undefined,
      type: AssetType.native,
      accountAssetInfo: undefined,
    });

    expect(state.isClassicTrustlineTrackedToken).toBe(false);
    expect(state.isTrustlineInactive).toBe(false);
    expect(state.showClassicTrustlineActivate).toBe(false);
    expect(state.hasClassicTrustlineToRemove).toBe(false);
  });

  it('detects classic token trustline but excludes SEP-41', () => {
    const sep41AssetId =
      'stellar:pubnet/sep41:CBIJBDNZNF4X35BJ4FFZWCDBSCKOP5NB4PLG4SNENRMLAPYG4P5FM6VN';
    const assetId =
      'stellar:pubnet/asset:USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';

    const sep41State = getTrustlineAssetPageState({
      chainId: XlmScope.Pubnet,
      assetId: sep41AssetId,
      type: AssetType.token,
      accountAssetInfo: undefined,
    });

    expect(sep41State.isClassicTrustlineTrackedToken).toBe(false);

    const classicState = getTrustlineAssetPageState({
      chainId: XlmScope.Pubnet,
      assetId,
      type: AssetType.token,
      accountAssetInfo: { limit: '0' },
    });

    expect(classicState.isClassicTrustlineTrackedToken).toBe(true);
    expect(classicState.isTrustlineInactive).toBe(true);
    expect(classicState.showClassicTrustlineActivate).toBe(true);
  });

  it('identifies an active classic trustline that can be removed', () => {
    const assetId = 'stellar:pubnet/asset:USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';

    const state = getTrustlineAssetPageState({
      chainId: XlmScope.Pubnet,
      assetId,
      type: AssetType.token,
      accountAssetInfo: { limit: '10' },
    });

    expect(state.isClassicTrustlineTrackedToken).toBe(true);
    expect(state.isTrustlineInactive).toBe(false);
    expect(state.showClassicTrustlineActivate).toBe(false);
    expect(state.hasClassicTrustlineToRemove).toBe(true);
  });
});
