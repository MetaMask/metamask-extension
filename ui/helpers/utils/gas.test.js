import { PriorityLevels } from '../../../shared/constants/gas';

import {
  gasEstimateGreaterThanGasUsedPlusTenPercent,
  formatGasFeeOrFeeRange,
  getGasValuesForReplacement,
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

  describe('getGasValuesForReplacement', () => {
    it('returns txParams unchanged when previousGas is missing', () => {
      const txParams = {
        maxFeePerGas: '0x5',
        maxPriorityFeePerGas: '0x5',
        gasLimit: '0x5208',
      };
      expect(
        getGasValuesForReplacement(txParams, undefined, 1.1),
      ).toStrictEqual(txParams);
      expect(getGasValuesForReplacement(txParams, null, 1.1)).toStrictEqual(
        txParams,
      );
    });

    it('returns gas at least previousGas × rate when txParams has lower values', () => {
      const txParams = {
        maxFeePerGas: '0x5',
        maxPriorityFeePerGas: '0x5',
        gasLimit: '0x5208',
      };
      const previousGas = {
        maxFeePerGas: '0x10',
        maxPriorityFeePerGas: '0x10',
        gasLimit: '0x5208',
      };
      const result = getGasValuesForReplacement(txParams, previousGas, 1.1);
      expect(Number(result.maxFeePerGas)).toBeGreaterThanOrEqual(0x12);
      expect(Number(result.maxPriorityFeePerGas)).toBeGreaterThanOrEqual(0x12);
    });

    it('returns txParams gas when higher than previousGas × rate', () => {
      const txParams = {
        maxFeePerGas: '0x100',
        maxPriorityFeePerGas: '0x100',
        gasLimit: '0x5208',
      };
      const previousGas = {
        maxFeePerGas: '0x10',
        maxPriorityFeePerGas: '0x10',
        gasLimit: '0x5208',
      };
      const result = getGasValuesForReplacement(txParams, previousGas, 1.1);
      expect(result.maxFeePerGas).toBe('0x100');
      expect(result.maxPriorityFeePerGas).toBe('0x100');
    });

    it('returns txParams when they exceed min replacement gas (0x-prefixed hex from toPrefixedHexString)', () => {
      // previousGas 70 GWEI × 1.1 ≈ 77 GWEI min. User chose 100 GWEI — must be kept.
      // Uses 0x-prefixed values as produced by Numeric#toPrefixedHexString().
      const txParams = {
        maxFeePerGas: '0x174876e800', // 100 GWEI
        maxPriorityFeePerGas: '0x174876e800',
        gasLimit: '0x5208',
      };
      const previousGas = {
        maxFeePerGas: '0x104c533c00', // 70 GWEI in hex WEI
        maxPriorityFeePerGas: '0x2540be400', // 10 GWEI
        gasLimit: '0x5208',
      };
      const result = getGasValuesForReplacement(txParams, previousGas, 1.1);
      expect(result.maxFeePerGas).toBe('0x174876e800');
      expect(result.maxPriorityFeePerGas).toBe('0x174876e800');
    });

    it('returns min replacement gas when txParams are lower (0x-prefixed hex)', () => {
      // 70 GWEI × 1.1 = 77 GWEI min. txParams at 70 GWEI → result should be ≥ 77 GWEI.
      const seventyGweiHex = '0x104c533c00';
      const tenGweiHex = '0x2540be400';
      const txParams = {
        maxFeePerGas: seventyGweiHex,
        maxPriorityFeePerGas: tenGweiHex,
        gasLimit: '0x5208',
      };
      const previousGas = {
        maxFeePerGas: seventyGweiHex,
        maxPriorityFeePerGas: tenGweiHex,
        gasLimit: '0x5208',
      };
      const result = getGasValuesForReplacement(txParams, previousGas, 1.1);
      const minMaxFeeWei = 77 * 1e9;
      const minMaxPriorityWei = 10 * 1.1 * 1e9;
      expect(Number(result.maxFeePerGas)).toBeGreaterThanOrEqual(minMaxFeeWei);
      expect(Number(result.maxPriorityFeePerGas)).toBeGreaterThanOrEqual(
        minMaxPriorityWei,
      );
    });

    it('returns txParams when higher than min and txParams use hex without 0x prefix', () => {
      // BigNumber(value) infers hex from 0x; hex without prefix also parses.
      const txParams = {
        maxFeePerGas: '174876e800', // 100 GWEI, no 0x
        maxPriorityFeePerGas: '174876e800',
        gasLimit: '0x5208',
      };
      const previousGas = {
        maxFeePerGas: '0x104c533c00', // 70 GWEI
        maxPriorityFeePerGas: '0x2540be400',
        gasLimit: '0x5208',
      };
      const result = getGasValuesForReplacement(txParams, previousGas, 1.1);
      expect(result.maxFeePerGas).toBe('174876e800');
      expect(result.maxPriorityFeePerGas).toBe('174876e800');
    });

    it('returns same value for gas and gasLimit (no mixed fallback chains)', () => {
      // txParams has gas but no gasLimit; previousGas has different gasLimit.
      // Result must use one effective gas limit for both fields.
      const txParams = {
        maxFeePerGas: '0x100',
        maxPriorityFeePerGas: '0x100',
        gas: '0x5208',
      };
      const previousGas = {
        maxFeePerGas: '0x10',
        maxPriorityFeePerGas: '0x10',
        gasLimit: '0x30d4',
      };
      const result = getGasValuesForReplacement(txParams, previousGas, 1.1);
      expect(result.gas).toBe(result.gasLimit);
      expect(result.gas).toBe('0x5208');
    });
  });
});
