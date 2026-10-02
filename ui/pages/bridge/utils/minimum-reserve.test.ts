import { ARC_USDC_TOKEN_ADDRESS } from '../../../../shared/constants/network';
import {
  calculateMaxAmountWithReserve,
  resolveMinimumReserveBalanceForCaipAssetId,
} from './minimum-reserve';

describe('minimum reserve utils', () => {
  it('subtracts the Arc native reserve from Arc ERC20 USDC Max amount', () => {
    expect(
      resolveMinimumReserveBalanceForCaipAssetId(
        `eip155:5042/erc20:${ARC_USDC_TOKEN_ADDRESS}`,
      ),
    ).toBe('0.05');
    expect(
      calculateMaxAmountWithReserve({
        balanceAmount: '10',
        caipAssetId: `eip155:5042/erc20:${ARC_USDC_TOKEN_ADDRESS}`,
        decimals: 6,
      }),
    ).toBe('9.95');
  });

  it('does not return a negative Max amount when Arc USDC balance is below the reserve', () => {
    expect(
      calculateMaxAmountWithReserve({
        balanceAmount: '0.01',
        caipAssetId: `eip155:5042/erc20:${ARC_USDC_TOKEN_ADDRESS}`,
        decimals: 6,
      }),
    ).toBe('0');
  });
});
