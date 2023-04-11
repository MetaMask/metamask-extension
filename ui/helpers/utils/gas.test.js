import { PriorityLevels } from '../../../shared/constants/gas';

import {
  gasEstimateGreaterThanGasUsedPlusTenPercent,
  formatGasFeeOrFeeRange,
} from './gas';

describe('Gas utils', () => {
  describe('gasEstimateGreaterThanGasUsedPlusTenPercent', () => {
    const compareGas = (estimateValues) => {
      return gasEstimateGreaterThanGasUsedPlusTenPercent(
        {
          maxFeePerGas: '0x59682f10',
          maxPriorityFeePerGas: '0x59682f00',
        },
        {
          medium: estimateValues,
        },
        PriorityLevels.medium,
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

  describe('formatGasFeeOrFeeRange', () => {
    describe('given a singular fee', () => {
      it('should return a string "X GWEI" where X is the fee rounded to the given precision', () => {
        expect(formatGasFeeOrFeeRange('23.43', { precision: 1 })).toStrictEqual(
          '23.4 GWEI',
        );
      });
    });

    describe('given an array of two fees', () => {
      describe('given a single precision', () => {
        it('should return a string "X - Y GWEI" where X and Y are the fees rounded to the given precision', () => {
          expect(
            formatGasFeeOrFeeRange(['23.43', '83.9342'], { precision: 1 }),
          ).toStrictEqual('23.4 - 83.9 GWEI');
        });
      });

      describe('given two precisions', () => {
        it('should return a string "X - Y GWEI" where X and Y are the fees rounded to the given precisions', () => {
          expect(
            formatGasFeeOrFeeRange(['23.43', '83.9342'], { precision: [1, 0] }),
          ).toStrictEqual('23.4 - 84 GWEI');
        });
      });

      describe('given more than two precisions', () => {
        it('should ignore precisions past 2', () => {
          expect(
            formatGasFeeOrFeeRange(['23.43', '83.9342'], {
              precision: [1, 0, 999],
            }),
          ).toStrictEqual('23.4 - 84 GWEI');
        });
      });
    });

    describe('given an array of more than two fees', () => {
      it('should ignore fees past two', () => {
        expect(
          formatGasFeeOrFeeRange(['23.43', '83.9342', '300.3414'], {
            precision: 1,
          }),
        ).toStrictEqual('23.4 - 83.9 GWEI');
      });
    });

    describe('if the fee is null', () => {
      it('should return null', () => {
        expect(formatGasFeeOrFeeRange(null, { precision: 1 })).toBeNull();
      });
    });

    describe('if the fee is undefined', () => {
      it('should return null', () => {
        expect(formatGasFeeOrFeeRange(null, { precision: 1 })).toBeNull();
      });
    });
  });
});
