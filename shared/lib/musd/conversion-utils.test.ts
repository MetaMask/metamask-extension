import BigNumber from 'bignumber.js';
import {
  convertToMusdAmount,
  convertFromMusdAmount,
  formatMusdAmount,
  parseMusdAmountToWei,
  calcTokenAmount,
  limitToMaximumDecimalPlaces,
  hexToDecimal,
  decimalToHex,
  convertMusdClaimAmount,
  getMusdOutputAmount,
  calculateTotalFees,
} from './conversion-utils';

describe('MUSD Conversion Utilities', () => {
  describe('calcTokenAmount', () => {
    it('should convert wei to token amount for 6 decimals', () => {
      // 1,000,000 wei = 1 token for 6 decimals
      const result = calcTokenAmount('1000000', 6);
      expect(result.toString()).toBe('1');
    });

    it('should convert wei to token amount for 18 decimals', () => {
      // 1e18 wei = 1 token for 18 decimals
      const result = calcTokenAmount('1000000000000000000', 18);
      expect(result.toString()).toBe('1');
    });

    it('should handle fractional amounts', () => {
      // 500,000 wei = 0.5 token for 6 decimals
      const result = calcTokenAmount('500000', 6);
      expect(result.toString()).toBe('0.5');
    });

    it('should handle string input', () => {
      const result = calcTokenAmount('100000000', 6);
      expect(result.toString()).toBe('100');
    });

    it('should handle BigNumber input', () => {
      const result = calcTokenAmount(new BigNumber('1000000'), 6);
      expect(result.toString()).toBe('1');
    });

    it('should handle zero', () => {
      const result = calcTokenAmount('0', 6);
      expect(result.toString()).toBe('0');
    });
  });

  describe('convertToMusdAmount', () => {
    it('should convert human-readable amount to mUSD wei (6 decimals)', () => {
      const result = convertToMusdAmount('100');
      expect(result).toBe('100000000');
    });

    it('should handle decimal amounts', () => {
      const result = convertToMusdAmount('100.50');
      expect(result).toBe('100500000');
    });

    it('should handle small amounts', () => {
      const result = convertToMusdAmount('0.01');
      expect(result).toBe('10000');
    });

    it('should handle very small amounts (1 cent)', () => {
      const result = convertToMusdAmount('0.000001');
      expect(result).toBe('1');
    });

    it('should handle zero', () => {
      const result = convertToMusdAmount('0');
      expect(result).toBe('0');
    });

    it('should truncate excess decimals', () => {
      // mUSD has 6 decimals, so 0.0000001 should truncate to 0
      const result = convertToMusdAmount('0.0000001');
      expect(result).toBe('0');
    });
  });

  describe('convertFromMusdAmount', () => {
    it('should convert mUSD wei to human-readable amount', () => {
      const result = convertFromMusdAmount('100000000');
      expect(result).toBe('100');
    });

    it('should handle fractional amounts', () => {
      const result = convertFromMusdAmount('100500000');
      expect(result).toBe('100.5');
    });

    it('should handle small amounts', () => {
      const result = convertFromMusdAmount('10000');
      expect(result).toBe('0.01');
    });

    it('should handle 1 wei', () => {
      const result = convertFromMusdAmount('1');
      expect(result).toBe('0.000001');
    });

    it('should handle zero', () => {
      const result = convertFromMusdAmount('0');
      expect(result).toBe('0');
    });
  });

  describe('formatMusdAmount', () => {
    it('should format amount with default 2 decimal places', () => {
      const result = formatMusdAmount('100.123456');
      expect(result).toBe('100.12');
    });

    it('should format amount with custom decimal places', () => {
      const result = formatMusdAmount('100.123456', 4);
      expect(result).toBe('100.1234');
    });

    it('should not add unnecessary decimals', () => {
      const result = formatMusdAmount('100');
      expect(result).toBe('100');
    });

    it('should handle amounts less than 1', () => {
      const result = formatMusdAmount('0.123456');
      expect(result).toBe('0.12');
    });

    it('should round down (truncate)', () => {
      const result = formatMusdAmount('100.999');
      expect(result).toBe('100.99');
    });
  });

  describe('parseMusdAmountToWei', () => {
    it('should parse string amount to wei', () => {
      const result = parseMusdAmountToWei('100');
      expect(result).toBe('100000000');
    });

    it('should parse number amount to wei', () => {
      const result = parseMusdAmountToWei(100);
      expect(result).toBe('100000000');
    });

    it('should handle decimals', () => {
      const result = parseMusdAmountToWei('100.5');
      expect(result).toBe('100500000');
    });
  });

  describe('limitToMaximumDecimalPlaces', () => {
    it('should limit decimals to specified precision', () => {
      const result = limitToMaximumDecimalPlaces('100.123456789', 2);
      expect(result).toBe('100.12');
    });

    it('should not add decimals if none exist', () => {
      const result = limitToMaximumDecimalPlaces('100', 2);
      expect(result).toBe('100');
    });

    it('should handle BigNumber input', () => {
      const result = limitToMaximumDecimalPlaces(new BigNumber('100.999'), 2);
      expect(result).toBe('100.99');
    });

    it('should handle number input', () => {
      const result = limitToMaximumDecimalPlaces(100.999, 2);
      expect(result).toBe('100.99');
    });
  });

  describe('hexToDecimal', () => {
    it('should convert hex string to decimal string', () => {
      expect(hexToDecimal('0x64')).toBe('100');
    });

    it('should handle hex without 0x prefix', () => {
      expect(hexToDecimal('64')).toBe('100');
    });

    it('should handle large numbers', () => {
      expect(hexToDecimal('0x5f5e100')).toBe('100000000'); // 100 mUSD in wei
    });

    it('should handle zero', () => {
      expect(hexToDecimal('0x0')).toBe('0');
    });
  });

  describe('decimalToHex', () => {
    it('should convert decimal string to hex with 0x prefix', () => {
      expect(decimalToHex('100')).toBe('0x64');
    });

    it('should convert number to hex', () => {
      expect(decimalToHex(100)).toBe('0x64');
    });

    it('should handle large numbers', () => {
      expect(decimalToHex('100000000')).toBe('0x5f5e100');
    });

    it('should handle zero', () => {
      expect(decimalToHex('0')).toBe('0x0');
    });
  });

  describe('convertMusdClaimAmount', () => {
    it('should convert claim amount with valid conversion rates', () => {
      const result = convertMusdClaimAmount({
        claimAmountRaw: '1000000', // 1 mUSD in wei
        conversionRate: 1.1, // EUR to native currency
        usdConversionRate: 1.0, // USD to native currency
      });

      expect(result.claimAmountDecimal.toString()).toBe('1');
      expect(result.isConverted).toBe(true);
      // fiatValue = claimAmount * (conversionRate / usdConversionRate)
      // 1 * (1.1 / 1.0) = 1.1
      expect(result.fiatValue.toNumber()).toBeCloseTo(1.1, 5);
    });

    it('should fallback to USD when conversion rates are zero', () => {
      const result = convertMusdClaimAmount({
        claimAmountRaw: '1000000', // 1 mUSD
        conversionRate: 0,
        usdConversionRate: 0,
      });

      expect(result.claimAmountDecimal.toString()).toBe('1');
      expect(result.fiatValue.toString()).toBe('1');
      expect(result.isConverted).toBe(false);
    });

    it('should handle BigNumber conversion rate', () => {
      const result = convertMusdClaimAmount({
        claimAmountRaw: '10000000', // 10 mUSD
        conversionRate: new BigNumber(0.85), // GBP rate
        usdConversionRate: 1.0,
      });

      expect(result.claimAmountDecimal.toString()).toBe('10');
      expect(result.isConverted).toBe(true);
      expect(result.fiatValue.toNumber()).toBeCloseTo(8.5, 5);
    });
  });

  describe('getMusdOutputAmount', () => {
    it('should calculate mUSD output from fiat input', () => {
      // $100 USD should give ~100 mUSD (1:1 ratio minus fees)
      const result = getMusdOutputAmount({
        inputAmountUsd: '100',
        bonusPercentage: 3,
        feeAmountUsd: '0.10',
      });

      // 100 * 1.03 - 0.10 = 102.90
      expect(result.outputAmountUsd).toBe('102.9');
    });

    it('should return mUSD in wei format', () => {
      const result = getMusdOutputAmount({
        inputAmountUsd: '100',
        bonusPercentage: 3,
        feeAmountUsd: '0',
      });

      // 100 * 1.03 = 103 mUSD = 103000000 wei
      expect(result.outputAmountWei).toBe('103000000');
    });

    it('should handle zero bonus', () => {
      const result = getMusdOutputAmount({
        inputAmountUsd: '100',
        bonusPercentage: 0,
        feeAmountUsd: '1',
      });

      // 100 - 1 = 99 mUSD
      expect(result.outputAmountUsd).toBe('99');
    });
  });

  describe('calculateTotalFees', () => {
    it('should sum all fee components', () => {
      const fees = {
        gas: { amountUsd: '0.50' },
        relayer: { amountUsd: '0.25' },
        relayerGas: { amountUsd: '0.10' },
        relayerService: { amountUsd: '0.05' },
        app: { amountUsd: '0' },
        subsidized: { amountUsd: '0' },
      };

      const result = calculateTotalFees(fees);
      // 0.50 + 0.25 = 0.75 (we typically only count gas + relayer)
      expect(parseFloat(result)).toBeCloseTo(0.75, 2);
    });

    it('should handle missing fee components', () => {
      const fees = {
        gas: { amountUsd: '0.50' },
        relayer: { amountUsd: '0.25' },
      };

      const result = calculateTotalFees(fees as any);
      expect(parseFloat(result)).toBeCloseTo(0.75, 2);
    });

    it('should handle zero fees', () => {
      const fees = {
        gas: { amountUsd: '0' },
        relayer: { amountUsd: '0' },
        relayerGas: { amountUsd: '0' },
        relayerService: { amountUsd: '0' },
        app: { amountUsd: '0' },
        subsidized: { amountUsd: '0' },
      };

      const result = calculateTotalFees(fees);
      expect(result).toBe('0');
    });
  });
});
