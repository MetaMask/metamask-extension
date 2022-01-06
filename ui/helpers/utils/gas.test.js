import { PRIORITY_LEVELS } from '../../../shared/constants/gas';

import {
  addTenPercent,
  gasEstimateGreaterThanGasUsedPlusTenPercent,
} from './gas';

describe('Gas utils', () => {
  describe('gasEstimateGreaterThanGasUsedPlusTenPercent', () => {
    const compareGas = (estimateValues) => {
      return gasEstimateGreaterThanGasUsedPlusTenPercent(
        {
          txParams: {
            maxFeePerGas: '0x59682f10',
            maxPriorityFeePerGas: '0x59682f00',
          },
        },
        {
          medium: estimateValues,
        },
        PRIORITY_LEVELS.MEDIUM,
      );
    };

    it('should return true if gas used in transaction + 10% is greater that estimate', () => {
      const result = compareGas({
        suggestedMaxPriorityFeePerGas: '7',
        suggestedMaxFeePerGas: '70',
      });
      expect(result).toStrictEqual(true);
    });

    it('should return false if gas used in transaction + 10% is less that estimate', () => {
      const result = compareGas({
        suggestedMaxPriorityFeePerGas: '.5',
        suggestedMaxFeePerGas: '1',
      });
      expect(result).toStrictEqual(false);
    });
  });

  describe('addTenPercent', () => {
    it('should add 10% to hex value passed', () => {
      const result = addTenPercent('0x59682f00');
      expect(result).toStrictEqual('0x62590080');
    });
    it('should return undefined if undefined value is passed', () => {
      const result = addTenPercent(undefined);
      expect(result).toBeUndefined();
    });
  });
});
