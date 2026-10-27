import { getNativeAssetForChainId } from '@metamask/bridge-controller';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import {
  calculateMaxAmountWithReserve,
  resolveMinimumReserveBalanceForCaipAssetId,
} from './minimum-reserve';

describe('minimum reserve utils', () => {
  it('subtracts the Monad native reserve from the Max amount', () => {
    const monadAssetId = getNativeAssetForChainId(CHAIN_IDS.MONAD).assetId;

    expect(resolveMinimumReserveBalanceForCaipAssetId(monadAssetId)).toBe('10');
    expect(
      calculateMaxAmountWithReserve({
        balanceAmount: '100',
        caipAssetId: monadAssetId,
        decimals: 18,
      }),
    ).toBe('90');
  });

  it('does not return a negative Max amount when the balance is below the reserve', () => {
    expect(
      calculateMaxAmountWithReserve({
        balanceAmount: '5',
        caipAssetId: getNativeAssetForChainId(CHAIN_IDS.MONAD).assetId,
        decimals: 18,
      }),
    ).toBe('0');
  });
});
