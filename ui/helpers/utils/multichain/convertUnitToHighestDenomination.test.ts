import { AssetType } from '../../../../shared/constants/transaction';
import { NativeAsset } from '../../../components/multichain/asset-picker-amount/asset-picker-modal/types';
import { convertUnitToHighestDenomination } from './convertUnitToHighestDenomination';

const mockAsset: NativeAsset & {
  balance: string;
  details: { decimals: number };
} = {
  balance: '1000000000000000000',
  details: { decimals: 8 },
  type: AssetType.native,
  // @ts-expect-error mock image
  image: './mock-image.svg',
  symbol: 'asset-symbol',
};

describe('convertUnitToHighestDenomination', () => {
  it('should convert unit to highest denomination', () => {
    const amount = '0.001';

    const result = convertUnitToHighestDenomination({
      asset: mockAsset,
      amount,
    });

    expect(result).toBe('1e-11');
  });

  it('should handle zero amount', () => {
    const amount = '0';

    const result = convertUnitToHighestDenomination({
      asset: mockAsset,
      amount,
    });

    expect(result).toBe('0');
  });

  it('should handle large amount', () => {
    const amount = '1000000000000000000000';

    const result = convertUnitToHighestDenomination({
      asset: mockAsset,
      amount,
    });

    expect(result).toBe('10000000000000');
  });

  it('should handle decimal amount', () => {
    const amount = '0.123456789';

    const result = convertUnitToHighestDenomination({
      asset: mockAsset,
      amount,
    });

    expect(result).toBe('1.23456789e-9');
  });
});
