import { isEIP1559Transaction, isLegacyTransaction } from './transaction.utils';

describe('Transaction.utils', function () {
  describe('isEIP1559Transaction', function () {
    it('should return true if both maxFeePerGas and maxPriorityFeePerGas are hex strings', () => {
      expect(
        isEIP1559Transaction({
          txParams: { maxFeePerGas: '0x1', maxPriorityFeePerGas: '0x1' },
        }),
      ).toBe(true);
    });

    it('should return false if either maxFeePerGas and maxPriorityFeePerGas are non-hex strings', () => {
      expect(
        isEIP1559Transaction({
          txParams: { maxFeePerGas: 0, maxPriorityFeePerGas: '0x1' },
        }),
      ).toBe(false);
      expect(
        isEIP1559Transaction({
          txParams: { maxFeePerGas: '0x1', maxPriorityFeePerGas: 'fail' },
        }),
      ).toBe(false);
    });

    it('should return false if either maxFeePerGas or maxPriorityFeePerGas are not supplied', () => {
      expect(
        isEIP1559Transaction({
          txParams: { maxPriorityFeePerGas: '0x1' },
        }),
      ).toBe(false);
      expect(
        isEIP1559Transaction({
          txParams: { maxFeePerGas: '0x1' },
        }),
      ).toBe(false);
    });
  });

  describe('isLegacyTransaction', function () {
    it('should return true if no gas related fields are supplied', () => {
      expect(
        isLegacyTransaction({
          txParams: {},
        }),
      ).toBe(true);
    });

    it('should return true if gasPrice is solely provided', () => {
      expect(
        isLegacyTransaction({
          txParams: { gasPrice: '0x1' },
        }),
      ).toBe(true);
    });

    it('should return false if gasPrice is not a hex string', () => {
      expect(
        isLegacyTransaction({
          txParams: { gasPrice: 100 },
        }),
      ).toBe(false);
    });

    it('should return false if either maxFeePerGas or maxPriorityFeePerGas are supplied', () => {
      expect(
        isLegacyTransaction({
          txParams: {
            maxFeePerGas: '0x1',
          },
        }),
      ).toBe(false);

      expect(
        isLegacyTransaction({
          txParams: {
            maxPriorityFeePerGas: 'any data',
          },
        }),
      ).toBe(false);
    });
  });
});
