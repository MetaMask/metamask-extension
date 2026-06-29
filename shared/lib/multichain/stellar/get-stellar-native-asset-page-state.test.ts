import { XlmScope } from '@metamask/keyring-api';
import { AssetType } from '../../../constants/transaction';
import { getStellarNativeAssetPageState } from './get-stellar-native-asset-page-state';

describe('getStellarNativeAssetPageState', () => {
  it('returns non-stellar state for non-stellar chain', () => {
    const state = getStellarNativeAssetPageState({
      chainId: 'eip155:1',
      type: AssetType.native,
      accountAssetInfo: undefined,
    });

    expect(state.showStellarNativeBalanceSection).toBe(false);
    expect(state.stellarNativeBaseReserve).toBeUndefined();
  });

  it('extracts base reserve for Stellar native assets', () => {
    const state = getStellarNativeAssetPageState({
      chainId: XlmScope.Pubnet,
      type: AssetType.native,
      accountAssetInfo: { baseReserve: '0.5' } as unknown as Record<
        string,
        unknown
      >,
    });

    expect(state.showStellarNativeBalanceSection).toBe(true);
    expect(state.stellarNativeBaseReserve).toBe('0.5');
  });
});
