import { getDecimalizedHexValue } from './numbers-utils';

describe('numbers-utils', () => {
  describe('getDecimalizedHexValue', () => {
    it('should convert hex value with 18 decimals', () => {
      // 1 ETH in wei (1e18) = 0xde0b6b3a7640000
      expect(getDecimalizedHexValue('0xde0b6b3a7640000', 18)).toBe('1');

      // 5000000000000000000 wei (5 ETH)
      expect(getDecimalizedHexValue('0x4563918244f40000', 18)).toBe('5');
    });

    it('should convert hex value with 6 decimals', () => {
      // 1000000 (1 TOKEN with 6 decimals)
      expect(getDecimalizedHexValue('0xf4240', 6)).toBe('1');

      // 100000000 (100 TOKEN)
      expect(getDecimalizedHexValue('0x5f5e100', 6)).toBe('100');
    });

    it('should convert hex value with 8 decimals', () => {
      // 100000000 (1 TOKEN with 8 decimals)
      expect(getDecimalizedHexValue('0x5f5e100', 8)).toBe('1');

      // 50000000 (0.5 TOKEN)
      expect(getDecimalizedHexValue('0x2faf080', 8)).toBe('0.5');
    });

    it('should handle zero value', () => {
      expect(getDecimalizedHexValue('0x0', 18)).toBe('0');
      expect(getDecimalizedHexValue('0x0', 6)).toBe('0');
      expect(getDecimalizedHexValue('0x0', 0)).toBe('0');
    });

    it('should handle small fractional amounts', () => {
      // 0.1 ETH = 100000000000000000 wei
      expect(getDecimalizedHexValue('0x16345785d8a0000', 18)).toBe('0.1');

      // 0.01 ETH = 10000000000000000 wei
      expect(getDecimalizedHexValue('0x2386f26fc10000', 18)).toBe('0.01');
    });

    it('should handle large amounts', () => {
      // 1,000,000 ETH in wei
      const largeAmount = '0xd3c21bcecceda1000000';
      expect(getDecimalizedHexValue(largeAmount, 18)).toBe('1000000');
    });

    it('should handle amounts with many decimal places', () => {
      // 1.123456789 ETH = 1123456789000000000 wei = 0xf9751ff4cd89200
      expect(getDecimalizedHexValue('0xf9751ff4cd89200', 18)).toBe(
        '1.123456789',
      );
    });

    it('should handle conversion without decimals (no shift)', () => {
      expect(getDecimalizedHexValue('0x64', 0)).toBe('100');
      expect(getDecimalizedHexValue('0xff', 0)).toBe('255');
      expect(getDecimalizedHexValue('0x3e8', 0)).toBe('1000');
    });

    it('should maintain precision for very small amounts', () => {
      // 1 wei (smallest unit for 18 decimals)
      expect(getDecimalizedHexValue('0x1', 18)).toBe('0.000000000000000001');

      // 1 smallest unit for 6 decimals
      expect(getDecimalizedHexValue('0x1', 6)).toBe('0.000001');
    });

    it('should handle edge case of undefined or zero decimals', () => {
      expect(getDecimalizedHexValue('0x64', 0)).toBe('100');
    });

    it('should convert values consistently regardless of hex case', () => {
      expect(getDecimalizedHexValue('0xFF', 0)).toBe('255');
      expect(getDecimalizedHexValue('0xff', 0)).toBe('255');
      expect(getDecimalizedHexValue('0xFf', 0)).toBe('255');
    });
  });
});
