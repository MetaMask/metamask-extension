import { XlmScope } from '@metamask/keyring-api';
import { AssetType } from '../../../constants/transaction';
import { getStellarAssetPageState } from './get-stellar-asset-page-state';

describe('getStellarAssetPageState', () => {
  it('returns non-stellar state for non-stellar chain', () => {
    const state = getStellarAssetPageState({
      chainId: 'eip155:1',
      assetId: undefined,
      type: AssetType.native,
      accountAssetInfo: undefined,
    });

    expect(state.isStellarChainId).toBe(false);
    expect(state.showStellarNativeBalanceSection).toBe(false);
    expect(state.stellarNativeBaseReserve).toBeUndefined();
  });

  it('extracts base reserve for Stellar native assets', () => {
    const state = getStellarAssetPageState({
      chainId: XlmScope.Pubnet,
      assetId: undefined,
      type: AssetType.native,
      accountAssetInfo: { baseReserve: '0.5' } as unknown as Record<
        string,
        unknown
      >,
    });

    expect(state.isStellarChainId).toBe(true);
    expect(state.showStellarNativeBalanceSection).toBe(true);
    expect(state.stellarNativeBaseReserve).toBe('0.5');
  });
});
