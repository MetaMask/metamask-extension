import { XlmScope } from '@metamask/keyring-api';
import { AssetType } from '../../constants/transaction';
import { getNativeReserveAssetPageState } from './get-native-reserve-asset-page-state';

describe('getNativeReserveAssetPageState', () => {
  it('returns non-stellar state for non-stellar chain', () => {
    const state = getNativeReserveAssetPageState({
      chainId: 'eip155:1',
      type: AssetType.native,
      accountAssetInfo: undefined,
    });

    expect(state.showNativeReserveBalanceSection).toBe(false);
    expect(state.nativeReserveBaseReserve).toBeUndefined();
  });

  it('extracts base reserve for Stellar native assets', () => {
    const state = getNativeReserveAssetPageState({
      chainId: XlmScope.Pubnet,
      type: AssetType.native,
      accountAssetInfo: { baseReserve: '0.5' } as unknown as Record<
        string,
        unknown
      >,
    });

    expect(state.showNativeReserveBalanceSection).toBe(true);
    expect(state.nativeReserveBaseReserve).toBe('0.5');
  });
});
